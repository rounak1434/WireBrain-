import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  saveFileDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<{ canceled: boolean; filePath?: string } | null>;
  openFileDialog: (options: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<{ filePath: string; content: string } | null>;
  writeFile: (filePath: string, content: string, isBase64?: boolean) => Promise<{ success: boolean; error?: string }>;
  getPlatform: () => Promise<string>;
}

const api: ElectronAPI = {
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
  writeFile: (filePath, content, isBase64) => ipcRenderer.invoke('write-file', filePath, content, isBase64),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
};

contextBridge.exposeInMainWorld('electronAPI', api);
