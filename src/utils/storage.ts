import { Project, ThemeMode } from '../types';
import { defaultProject } from '../data/starterBoards';
import { getAllAssets, saveAllAssets } from './assets';

// Primary WireBrain keys with safe legacy fallback
const STORAGE_KEY = 'wirebrain_project_v1';
const LEGACY_STORAGE_KEY = 'wirecraft_project_v1';

const THEME_KEY = 'wirebrain_theme_v1';
const LEGACY_THEME_KEY = 'wirecraft_theme_v1';

const WELCOME_KEY = 'wirebrain_welcome_completed_v1';
const LEGACY_WELCOME_KEY = 'wirecraft_welcome_completed_v1';

const TUTORIAL_KEY = 'wirebrain_tutorial_progress_v1';
const LEGACY_TUTORIAL_KEY = 'wirecraft_tutorial_progress_v1';

declare global {
  interface Window {
    electronAPI?: {
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
    };
  }
}

export function loadProjectFromStorage(): Project {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        // Safe migration from legacy key
        try {
          localStorage.setItem(STORAGE_KEY, raw);
        } catch {}
      }
    }
    if (!raw) return defaultProject;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.boards) && parsed.boards.length > 0) {
      // Reconcile starter boards if they are using outdated starter templates
      const updatedBoards = parsed.boards.map((b: any) => {
        if (b.id === 'board-mobile') {
          const hasScreen2 = Array.isArray(b.elements) && b.elements.some((e: any) => e.id === 'mob-frame-2');
          const hasStrayConn = Array.isArray(b.connectors) && b.connectors.some((c: any) => c.toId === 'mob-note-card');
          if (!hasScreen2 || hasStrayConn) {
            const freshMobileBoard = defaultProject.boards.find((db) => db.id === 'board-mobile');
            if (freshMobileBoard) {
              return freshMobileBoard;
            }
          }
        }
        return b;
      });
      return {
        ...parsed,
        boards: updatedBoards,
      };
    }
  } catch (err) {
    console.error('Failed to parse saved project from storage:', err);
  }
  return defaultProject;
}

export function saveProjectToStorage(project: Project): void {
  try {
    const serialized = JSON.stringify(project);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.error('Failed to save project to storage:', err);
  }
}

// Theme preference persistence with safe legacy migration
export function loadThemePreference(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY);
    if (saved === 'midnight' || saved === 'pure-black') {
      return saved;
    }
  } catch {}
  return 'pure-black'; // Default to true black
}

export function saveThemePreference(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (err) {
    console.error('Failed to save theme preference:', err);
  }
}

// First-launch welcome completed persistence with safe legacy migration
export function isWelcomeCompleted(): boolean {
  try {
    const status = localStorage.getItem(WELCOME_KEY) || localStorage.getItem(LEGACY_WELCOME_KEY);
    return status === 'true';
  } catch {
    return false;
  }
}

export function setWelcomeCompleted(completed: boolean): void {
  try {
    localStorage.setItem(WELCOME_KEY, completed ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to save welcome completion state:', err);
  }
}

// Tutorial progress persistence with safe legacy migration
export function loadTutorialProgress(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(TUTORIAL_KEY) || localStorage.getItem(LEGACY_TUTORIAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function saveTutorialProgress(progress: Record<string, boolean>): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error('Failed to save tutorial progress:', err);
  }
}

export async function exportProjectToFile(project: Project): Promise<boolean> {
  let projectWithAssets: Project = { ...project };
  try {
    const allAssets = await getAllAssets();
    if (allAssets.length > 0) {
      projectWithAssets.assets = allAssets;
    }
  } catch (err) {
    console.warn('Could not collect assets for export:', err);
  }

  const jsonStr = JSON.stringify(projectWithAssets, null, 2);
  const fileName = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.wirebrain.json`;

  if (window.electronAPI) {
    try {
      const dialogRes = await window.electronAPI.saveFileDialog({
        title: 'Export WireBrain Project',
        defaultPath: fileName,
        filters: [{ name: 'WireBrain Project (*.json)', extensions: ['json'] }],
      });
      if (dialogRes && !dialogRes.canceled && dialogRes.filePath) {
        const writeRes = await window.electronAPI.writeFile(dialogRes.filePath, jsonStr);
        return writeRes.success;
      }
      return false;
    } catch (e) {
      console.warn('Electron save dialog failed, falling back to download:', e);
    }
  }

  // Web download fallback
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export async function importProjectFromFile(): Promise<Project | null> {
  if (window.electronAPI) {
    try {
      const openRes = await window.electronAPI.openFileDialog({
        title: 'Open WireBrain Project',
        filters: [{ name: 'WireBrain Project (*.json)', extensions: ['json'] }],
      });
      if (openRes && openRes.content) {
        const parsed = JSON.parse(openRes.content);
        if (parsed && Array.isArray(parsed.boards)) {
          if (parsed.assets && Array.isArray(parsed.assets)) {
            await saveAllAssets(parsed.assets);
          }
          return parsed;
        }
      }
      return null;
    } catch (e) {
      console.warn('Electron open dialog failed, falling back to file input:', e);
    }
  }

  // Browser file input fallback
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = async (re) => {
        try {
          const parsed = JSON.parse(re.target?.result as string);
          if (parsed && Array.isArray(parsed.boards)) {
            if (parsed.assets && Array.isArray(parsed.assets)) {
              await saveAllAssets(parsed.assets);
            }
            resolve(parsed);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
