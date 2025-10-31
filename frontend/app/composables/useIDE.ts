import { reactive, ref } from 'vue';
import { useSocket } from './useSocket';
import type { DirectoryTreeType, ActiveFile, Resource, CreationContext, ReadFileResponse, ReadFolderResponse, WatchResponse, RenameData } from '~~/types/file-tree';

const { socketClient } = useSocket();

// Initialize directory tree structure
const initDirectory: DirectoryTreeType = {
  workspace: {
    type: 'directory',
    isOpen: true,
    path: '/workspace',
    name: 'workspace',
    content: {},
  },
};

// Reactive state
const directoryTree = reactive<DirectoryTreeType>(initDirectory);
const activeTab = reactive<ActiveFile>({
  filePath: '',
  fileContent: '',
});
const activeResources = reactive<Resource[]>([]);
activeResources.push({
  type: 'directory',
  path: '/workspace',
  name: 'workspace',
});

const resourceCreation = reactive<CreationContext>({
  isCreating: false,
  type: 'file',
  name: '',
});

const isDragging = ref(false);
const showTerminal = ref(false);
const url = ref('');
const activeTerminal = ref<string>('');
const openFolders = ref<string[]>(['/workspace']);
const openTabs = reactive<{ tabs: ActiveFile[] }>({ tabs: [] });
const savingFiles = ref<Set<string>>(new Set());
const deletingResources = ref<Set<string>>(new Set());
const movingResources = ref<Set<string>>(new Set());
const isSocketConnected = ref(false);
const cursorPosition = ref({ line: 1, col: 1 });

export const useIDE = () => {
  // --- Directory Tree Management ---

  const setDirectoryTree = (newDirectoryTree: DirectoryTreeType) => {
    directoryTree.workspace = newDirectoryTree.workspace!;
  };

  // --- Tab Management ---

  const setActiveTab = (newActive: ActiveFile) => {
    activeTab.filePath = newActive.filePath;
    activeTab.fileContent = newActive.fileContent;
  };

  const setOpenTabs = (newOpenTabs: ActiveFile[]) => {
    openTabs.tabs = newOpenTabs;
  };

  const setTabContent = (tab: ActiveFile) => {
    for (let i = 0; i < openTabs.tabs.length; i++) {
      const openTab = openTabs.tabs[i];
      if (openTab && tab.filePath === openTab.filePath) {
        openTab.fileContent = tab.fileContent;
        return;
      }
    }
  };

  const addNewTab = (newOpen: ActiveFile) => {
    for (let i = 0; i < openTabs.tabs.length; i++) {
      const openTab = openTabs.tabs[i];
      if (openTab && newOpen.filePath === openTab.filePath) {
        setActiveTab(newOpen);
        return;
      }
    }
    openTabs.tabs.push(newOpen);
    setActiveTab(newOpen);
  };

  const deleteTab = (openFile: ActiveFile, openFileIdx: number) => {
    const newOpenTabs = openTabs.tabs.filter(({ filePath }) => filePath !== openFile.filePath);
    if (newOpenTabs.length > 0) {
        if (activeTab?.filePath === openFile.filePath) {
            const newOpenTab = newOpenTabs[Math.max(0, openFileIdx - 1)]
            if (newOpenTab) setActiveTab(newOpenTab);
      }
    } else {
      setActiveTab({
        filePath: '',
        fileContent: '',
      });
    }
    setOpenTabs(newOpenTabs);
  };

  // --- Resource Selection ---

  const toggleActive = (res: Resource, isMultiSelect: boolean = false) => {
    const index = activeResources.findIndex((r) => r.path === res.path);

    if (!isMultiSelect) {
      // Single selection mode
      if (activeResources.length === 1 && index !== -1) {
        // Deselect if clicking the same resource
        activeResources.splice(0, activeResources.length);
      } else {
        // Select only this resource
        activeResources.splice(0, activeResources.length, res);
      }
    } else {
      // Multi-selection mode
      if (index !== -1) {
        // Remove if already selected
        activeResources.splice(index, 1);
      } else {
        // Add to selection
        activeResources.push(res);
      }
    }
  };

  const clearSelection = () => {
    activeResources.splice(0, activeResources.length);
    // Set default resource after clearing
    activeResources.push({
      type: 'directory',
      path: '/workspace',
      name: 'workspace',
    });
  };

  // --- Resource Creation ---
  const handleCreateSubmit = () => {
    resourceCreation.isCreating = false;
    const folder = activeResources[0]?.type === 'directory'
      ? activeResources[0].path
      : activeResources[0]?.path.substring(0, activeResources[0].path.lastIndexOf('/'));
    const targetPath = folder + '/' + resourceCreation.name;

    if (resourceCreation.type === 'file') {
      socketClient.createFile({
        targetPath,
      });
      const newActiveTab = {
        filePath: targetPath,
        fileContent: '',
      };
      addNewTab(newActiveTab);
    } else {
      socketClient.createFolder({
        targetPath,
      });
    }
  };

  const handleCreateFile = () => {
    resourceCreation.isCreating = true;
    resourceCreation.type = 'file';
    resourceCreation.name = 'New file';
  };

  const handleCreateFolder = () => {
    resourceCreation.isCreating = true;
    resourceCreation.type = 'folder';
    resourceCreation.name = 'New folder';
  };

  const addOpenFolder = (folderPath: string) => {
    if (!openFolders.value.includes(folderPath)) {
      openFolders.value.push(folderPath);
    }
  };

  const removeOpenFolder = (folderPath: string) => {
    openFolders.value = openFolders.value.filter((folder) => folder !== folderPath);
  };

  const toggleOpenFolder = (folderPath: string) => {
    if (openFolders.value.includes(folderPath)) {
      removeOpenFolder(folderPath);
    } else {
      addOpenFolder(folderPath);
    }
  };

  // --- File System Operations Handlers ---

  const handleFileDelete = (filePath: string) => {
    deletingResources.value.add(filePath);

    socketClient.deleteResource({ targetPath: filePath });
  };

  const handleDirectoryDelete = (dirPath: string) => {
    deletingResources.value.add(dirPath);

    socketClient.deleteResource({ targetPath: dirPath });
  };

  const handleRename = (oldPath: string, newPath: string) => {
    // Update tab paths if present
    const tabIndex = openTabs.tabs.findIndex((tab) => tab.filePath === oldPath);
    if (tabIndex !== -1) {
      openTabs.tabs[tabIndex]!.filePath = newPath;
      if (activeTab.filePath === oldPath) {
        activeTab.filePath = newPath;
      }
    }

    // Update open folders if it was a directory
    const folderIndex = openFolders.value.findIndex((folder) => folder === oldPath);
    if (folderIndex !== -1) {
      openFolders.value[folderIndex] = newPath;
      // Update child folder paths
      openFolders.value = openFolders.value.map((folder) =>
        folder.startsWith(oldPath) ? newPath + folder.slice(oldPath.length) : folder
      );
    }

    // Emit move event
    socketClient.moveResource({ targetPath: oldPath, newPath });
  };

  const handleBatchMove = (moves: { oldPath: string; newPath: string }[]) => {
    moves.forEach(({ oldPath, newPath }) => {
      // Update tab paths if present
      const tabIndex = openTabs.tabs.findIndex((tab) => tab.filePath === oldPath);
      if (tabIndex !== -1) {
        openTabs.tabs[tabIndex]!.filePath = newPath;
        if (activeTab.filePath === oldPath) {
          activeTab.filePath = newPath;
        }
      }

      // Update open folders if it was a directory
      const folderIndex = openFolders.value.findIndex((folder) => folder === oldPath);
      if (folderIndex !== -1) {
        openFolders.value[folderIndex] = newPath;
        // Update child folder paths
        openFolders.value = openFolders.value.map((folder) =>
          folder.startsWith(oldPath) ? newPath + folder.slice(oldPath.length) : folder
        );
      }

      // Emit move event
      socketClient.moveResource({ targetPath: oldPath, newPath });
    });
  };

  // --- File Operations ---

  const openFile = (filePath: string) => {
    socketClient.readFile(
      { targetPath: filePath },
      (response: ReadFileResponse) => {
        const newTab: ActiveFile = {
          filePath: response.targetPath,
          fileContent: response.fileContent,
        };
        addNewTab(newTab);
      }
    );
  };

  const saveFile = (filePath: string, content: string) => {
    savingFiles.value.add(filePath);
    socketClient.updateFile({
      targetPath: filePath,
      fileContent: content,
    });
    setTabContent({ filePath, fileContent: content });
  };

  const loadDirectory = (dirPath: string = '/workspace') => {
    socketClient.readFolder(
      { targetPath: dirPath },
      (response: ReadFolderResponse) => {
        console.log('[IDE] Directory loaded:', response);
        // You can update the directory tree here based on the response
      }
    );
  };

  // --- File Watching ---

  const startWatching = () => {
    socketClient.handleWatch((data: WatchResponse) => {
      console.log('[IDE] File system change:', data);

      // Handle different file system events
      switch (data.event) {
        case 'rename':
          if (typeof data.data !== 'string') {
            const renameData = data.data as RenameData;
            handleRename(renameData.oldPath, renameData.newPath);
          }
          break;
        case 'unlink':
          if (typeof data.data === 'string') {
            handleFileDelete(data.data);
          }
          break;
        case 'unlinkDir':
          if (typeof data.data === 'string') {
            handleDirectoryDelete(data.data);
          }
          break;
        case 'add':
        case 'addDir':
        case 'change':
          // Optionally reload directory tree
          loadDirectory();
          break;
      }
    });
  };

  // --- Terminal Management ---

  const setActiveTerminal = (id: string) => {
    activeTerminal.value = id;
  };

  // --- URL Management ---

  const changeURL = (newUrl: string) => {
    url.value = newUrl;
  };

  const setIsDragging = (isDrag: boolean) => {
    isDragging.value = isDrag;
  };

  const setSocketConnected = (connected: boolean) => {
    isSocketConnected.value = connected;
  };

  const setCursorPosition = (line: number, col: number) => {
    cursorPosition.value = { line, col };
  };

  return {
    // Reactive State
    url,
    isDragging,
    activeTab,
    activeResources,
    directoryTree,
    openTabs,
    resourceCreation,
    showTerminal,
    openFolders,
    activeTerminal,
    savingFiles,
    deletingResources,
    movingResources,
    isSocketConnected,
    cursorPosition,

    // Setters
    setIsDragging,
    setActiveTab,
    setDirectoryTree,
    setOpenTabs,
    setTabContent,
    setActiveTerminal,
    setSocketConnected,
    setCursorPosition,

    // Tab Management
    addNewTab,
    deleteTab,

    // Resource Selection
    toggleActive,
    clearSelection,

    // Resource Creation
    handleCreateSubmit,
    handleCreateFile,
    handleCreateFolder,

    // Folder Management
    addOpenFolder,
    removeOpenFolder,
    toggleOpenFolder,

    // File System Operations
    handleFileDelete,
    handleDirectoryDelete,
    handleRename,
    handleBatchMove,

    // File Operations
    openFile,
    saveFile,
    loadDirectory,

    // File Watching
    startWatching,

    // URL Management
    changeURL,
  };
};