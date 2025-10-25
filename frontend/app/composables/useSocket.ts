import type { CreateFileEventType, CreateFolderEventType, ReadFileEventType, ReadFileResponse, ReadFolderEventType, ReadFolderResponse, UpdateFileEventType, MoveEventType, DeleteEventType, WatchResponse } from '~~/types/file-tree';

type MessageHandler = (data: any) => void;

interface WebSocketMessage {
  event: string;
  data?: any;
  ack?: string; // Acknowledgment ID for request/response pattern
}

class SocketClient {
  private socket: WebSocket | null = null;
  private url: string = '';
  private authToken?: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private eventHandlers: Map<string, MessageHandler[]> = new Map();
  private ackCallbacks: Map<string, (data: any) => void> = new Map();
  private ackCounter: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Initializes the socket connection.
   * @param url - The URL of the Bridge WebSocket server.
   * @param authToken - (Optional) A JWT for authenticating the connection.
   */
  initialize(url: string, authToken?: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.socket) {
      this.socket.close();
    }

    this.url = url;
    this.authToken = authToken;
    this.createConnection();
  }

  private createConnection() {
    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('[Socket] Connected');
        this.reconnectAttempts = 0;

        // Trigger connect event handlers
        const handlers = this.eventHandlers.get('connect') || [];
        handlers.forEach(handler => handler({}));
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          // Handle acknowledgment responses
          if (message.ack && this.ackCallbacks.has(message.ack)) {
            const callback = this.ackCallbacks.get(message.ack);
            if (callback) {
              callback(message.data);
              this.ackCallbacks.delete(message.ack);
            }
            return;
          }

          // Handle regular event messages
          const handlers = this.eventHandlers.get(message.event) || [];
          handlers.forEach(handler => handler(message.data));
        } catch (error) {
          console.error('[Socket] Failed to parse message:', error);
        }
      };

      this.socket.onclose = (event: CloseEvent) => {
        console.log(`[Socket] Disconnected. Code: ${event.code}, Reason: ${event.reason}`);

        // Trigger disconnect event handlers
        const handlers = this.eventHandlers.get('disconnect') || [];
        handlers.forEach(handler => handler({ code: event.code, reason: event.reason }));

        this.attemptReconnect();
      };

      this.socket.onerror = (error: Event) => {
        console.error('[Socket] Connection Error:', error);

        // Trigger error event handlers
        const handlers = this.eventHandlers.get('connect_error') || [];
        handlers.forEach(handler => handler({ message: 'Connection error' }));
      };
    } catch (error) {
      console.error('[Socket] Failed to create WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Socket] Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`[Socket] Attempting to reconnect in ${delay}ms...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.createConnection();
    }, delay);
  }

  /**
   * Execute callback when connected.
   */
  connect(callback: () => void) {
    if (!this.socket) {
      console.error('[Socket] Socket not initialized. Call initialize() first.');
      return;
    }

    if (this.socket.readyState === WebSocket.OPEN) {
      callback();
      return;
    }

    this.on('connect', callback);
  }

  /**
   * Checks if socket is connected.
   */
  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Gets the socket instance.
   */
  get instance(): WebSocket | null {
    return this.socket;
  }

  /**
   * Emit an event to the server
   */
  private emit(event: string, data?: any, callback?: (response: any) => void) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('[Socket] Cannot emit - socket not connected');
      return;
    }

    const message: WebSocketMessage = { event, data };

    // Handle acknowledgment callback
    if (callback) {
      const ackId = `ack_${++this.ackCounter}`;
      message.ack = ackId;
      this.ackCallbacks.set(ackId, callback);
    }

    this.socket.send(JSON.stringify(message));
  }

  /**
   * Register an event handler
   */
  private on(event: string, handler: MessageHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Public method to register event handlers for connection events
   */
  public onConnectError(handler: (error: any) => void) {
    this.on('connect_error', handler);
  }

  /**
   * Public method to register event handlers for disconnect events
   */
  public onDisconnect(handler: (data: any) => void) {
    this.on('disconnect', handler);
  }

  // --- File System Operations ---

  createFile(event: CreateFileEventType) {
    this.emit('crud-create-file', event);
  }

  createFolder(event: CreateFolderEventType) {
    this.emit('crud-create-folder', event);
  }

  readFile(event: ReadFileEventType, callback?: (response: ReadFileResponse) => void) {
    this.emit('crud-read-file', event, callback);
  }

  readFolder(event: ReadFolderEventType, callback?: (response: ReadFolderResponse) => void) {
    this.emit('crud-read-folder', event, callback);
  }

  updateFile(event: UpdateFileEventType) {
    this.emit('crud-update-file', event);
  }

  moveResource(event: MoveEventType) {
    this.emit('crud-move-resource', event);
  }

  deleteResource(event: DeleteEventType) {
    this.emit('crud-delete-resource', event);
  }

  handleWatch(handle: (data: WatchResponse) => void) {
    this.on('add', (data) => handle({ event: 'add', data }));
    this.on('addDir', (data) => handle({ event: 'addDir', data }));
    this.on('change', (data) => handle({ event: 'change', data }));
    this.on('unlink', (data) => handle({ event: 'unlink', data }));
    this.on('unlinkDir', (data) => handle({ event: 'unlinkDir', data }));
    this.on('rename', (data) => handle({ event: 'rename', data }));
  }

  // --- File System Event Handlers ---

  handleReadFile(handle: (response: ReadFileResponse) => void) {
    this.on('crud-read-file', handle);
  }

  handleReadFolder(handle: (response: ReadFolderResponse) => void) {
    this.on('crud-read-folder', handle);
  }

  // --- Terminal Operations ---

  createTerminal(terminalId: string) {
    this.emit('create-terminal', { id: terminalId });
  }

  closeTerminal(terminalId: string) {
    this.emit('close-terminal', { id: terminalId });
  }

  inputTerminal(data: { id: string; input: string }) {
    this.emit('terminal-input', data);
  }

  handleTerminalData(handle: (response: { id: string; content: string }) => void) {
    this.on('terminal-data', handle);
  }

  // --- Project Operations ---

  startPreview(command: string) {
    const ackId = `ack_${++this.ackCounter}`;
    this.emit('command-preview', { command, ackID: ackId });
  }

  handlePreview(handle: (data: any) => void) {
    this.on('command-result-preview', handle);
  }

  runProject(command: string) {
    const ackId = `ack_${++this.ackCounter}`;
    this.emit('command-run', { command, ackID: ackId });
  }

  downloadProject(targetPath: string) {
    this.emit('crud-download-workspace', { targetPath });
  }

  handleDownload(handle: (zipContent: ArrayBuffer) => void) {
    this.on('download-workspace', handle);
  }

  // --- Additional Operations ---

  init() {
    this.emit('init', {});
  }

  hydrateCreateFile(targetPath: string, contentBase64: string) {
    this.emit('hydrate-create-file', { targetPath, contentBase64 });
  }

  collapseFolder(targetPath: string) {
    this.emit('crud-collapse-folder', { targetPath });
  }

  closeFile(targetPath: string) {
    this.emit('crud-close-file', { targetPath });
  }

  // --- Connection Management ---

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.eventHandlers.clear();
    this.ackCallbacks.clear();
  }
}

// Create singleton instance
const socketClient = new SocketClient();

/**
 * Get the appropriate WebSocket URL based on environment
 * @param workspaceName - The workspace name (k8s name)
 * @returns The WebSocket URL to connect to
 */
export const getSocketUrl = (workspaceName: string): string => {
  const config = useRuntimeConfig();
  const env = config.public.ENV || config.ENV || 'PROD';

  if (env === 'DEV') {
    // In development, connect to local bridge
    return 'ws://localhost:2024/ws';
  } else {
    // In production, connect to the workspace-specific ingress
    return `ws://${workspaceName}.room.com/ws`;
  }
};

export const useSocket = () => {
  return { socketClient, getSocketUrl };
};