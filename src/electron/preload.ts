import { contextBridge, ipcRenderer } from 'electron';
import type { NotegitApi } from '../shared/types/api';

const api: NotegitApi = {
  config: {
    getFull: () => ipcRenderer.invoke('config:getFull'),
    getAppSettings: () => ipcRenderer.invoke('config:getAppSettings'),
    updateAppSettings: (settings) => ipcRenderer.invoke('config:updateAppSettings', settings),
    updateRepoSettings: (settings) => ipcRenderer.invoke('config:updateRepoSettings', settings),
    getFavorites: () => ipcRenderer.invoke('config:getFavorites'),
    updateFavorites: (favorites) => ipcRenderer.invoke('config:updateFavorites', favorites),
    checkGitInstalled: () => ipcRenderer.invoke('config:checkGitInstalled'),
    getProfiles: () => ipcRenderer.invoke('config:getProfiles'),
    getActiveProfileId: () => ipcRenderer.invoke('config:getActiveProfileId'),
    createProfile: (name, repoSettings) => ipcRenderer.invoke('config:createProfile', name, repoSettings),
    deleteProfile: (profileId) => ipcRenderer.invoke('config:deleteProfile', profileId),
    setActiveProfile: (profileId) => ipcRenderer.invoke('config:setActiveProfile', profileId),
    restartApp: () => ipcRenderer.invoke('app:restart'),
  },
  repo: {
    openOrClone: (settings) => ipcRenderer.invoke('repo:openOrClone', settings),
    getStatus: () => ipcRenderer.invoke('repo:getStatus'),
    fetch: () => ipcRenderer.invoke('repo:fetch'),
    pull: () => ipcRenderer.invoke('repo:pull'),
    push: () => ipcRenderer.invoke('repo:push'),
    startAutoPush: () => ipcRenderer.invoke('repo:startAutoPush'),
  },
  files: {
    listTree: () => ipcRenderer.invoke('files:listTree'),
    read: (path) => ipcRenderer.invoke('files:read', path),
    save: (path, content) => ipcRenderer.invoke('files:save', path, content),
    saveWithGitWorkflow: (path, content, isAutosave) =>
      ipcRenderer.invoke('files:saveWithGitWorkflow', path, content, isAutosave),
    commit: (path, message) => ipcRenderer.invoke('files:commit', path, message),
    commitAll: (message) => ipcRenderer.invoke('files:commitAll', message),
    commitAndPushAll: () => ipcRenderer.invoke('files:commitAndPushAll'),
    create: (parentPath, name) => ipcRenderer.invoke('files:create', parentPath, name),
    createFile: (parentPath, name) => ipcRenderer.invoke('files:create', parentPath, name),
    createFolder: (parentPath, name) => ipcRenderer.invoke('files:createFolder', parentPath, name),
    delete: (path) => ipcRenderer.invoke('files:delete', path),
    rename: (oldPath, newPath) => ipcRenderer.invoke('files:rename', oldPath, newPath),
    saveAs: (repoPath, destPath) => ipcRenderer.invoke('files:saveAs', repoPath, destPath),
    import: (sourcePath, targetPath) => ipcRenderer.invoke('files:import', sourcePath, targetPath),
  },
  dialog: {
    showOpenDialog: (options) => ipcRenderer.invoke('dialog:showOpenDialog', options),
    showSaveDialog: (options) => ipcRenderer.invoke('dialog:showSaveDialog', options),
  },
  history: {
    getForFile: (path) => ipcRenderer.invoke('history:getForFile', path),
    getVersion: (commitHash, path) => ipcRenderer.invoke('history:getVersion', commitHash, path),
    getDiff: (hash1, hash2, path) => ipcRenderer.invoke('history:getDiff', hash1, hash2, path),
  },
  search: {
    query: (query, options) => ipcRenderer.invoke('search:query', query, options),
    repoWide: (query, options) => ipcRenderer.invoke('search:repoWide', query, options),
    replaceInRepo: (query, replacement, options) =>
      ipcRenderer.invoke('search:replaceInRepo', query, replacement, options),
  },
  export: {
    note: (fileName, content, defaultExtension) =>
      ipcRenderer.invoke('export:note', fileName, content, defaultExtension),
    repoZip: () => ipcRenderer.invoke('export:repoZip'),
  },
  logs: {
    getContent: (logType) => ipcRenderer.invoke('logs:getContent', logType),
    export: (logType, destPath) => ipcRenderer.invoke('logs:export', logType, destPath),
  },
};

contextBridge.exposeInMainWorld('notegitApi', api);
