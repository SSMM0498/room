export type ActiveFile = {
  filePath: string
  fileContent: string
}

export type CreationContext = {
  isCreating: boolean,
  type: "file" | "folder",
  name: string,
}

export type Resource = {
  type: "directory" | "file"
  path: string
  name: string
}

export type ResourceNode = {
  type: "directory" | "file";
  isOpen: boolean;
  path: string;
  name: string;
  content: DirectoryTreeType;
}

export type DirectoryTreeType = {
  [key: string]: ResourceNode
}

export type CreateFolderEventType = {
  targetPath: string
}

export type CreateFileEventType = {
  targetPath: string
  fileContent?: string | ArrayBuffer
}

export type ReadFileEventType = CreateFolderEventType

export type ReadFolderEventType = CreateFolderEventType

export type DeleteEventType = CreateFolderEventType

export type MoveEventType = {
  targetPath: string
  newPath: string
}

export type UpdateFileEventType = {
  targetPath: string
  fileContent: string
}

export type CrudEventType =
  | CreateFolderEventType
  | CreateFileEventType
  | ReadFileEventType
  | ReadFolderEventType
  | DeleteEventType
  | MoveEventType
  | UpdateFileEventType

export type ReadFolderResponse = {
  targetPath: string
  folderContents: {
      type: "file" | "directory"
      path: string
      name: string
  }[]
}

export type ReadFileResponse = {
  targetPath: string
  fileContent: string
}

export type WatchEvent = "add" | "addDir" | "change" | "unlink" | "unlinkDir" | "rename"

export type RenameData = {
  oldPath: string
  newPath: string
}

export type WatchResponse = {
  event: WatchEvent
  data: RenameData | string
}

export type CrudResponse = ReadFolderResponse | ReadFileResponse

export type TerminalEvent = {
  pid: number
  data: string
}

export function debounce<T extends Function>(cb: T, wait = 20) {
  let h: NodeJS.Timeout | null = null;
  let callable = (...args: any) => {
      clearTimeout(h as NodeJS.Timeout);
      h = setTimeout(() => cb(...args), wait);
  };
  return <T>(<any>callable);
}