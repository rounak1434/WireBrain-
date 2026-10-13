import { ProjectAsset } from '../types';

const DB_NAME = 'WireBrainDB_v1';
const ASSET_STORE = 'project_assets';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;
const memoryCache = new Map<string, string>();

/**
 * Initialize or get open IndexedDB connection
 */
export function initAssetDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(ASSET_STORE)) {
        db.createObjectStore(ASSET_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Store a project asset in IndexedDB and memory cache
 */
export async function saveAsset(asset: ProjectAsset): Promise<void> {
  try {
    memoryCache.set(asset.id, asset.data);
    const db = await initAssetDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ASSET_STORE, 'readwrite');
      const store = tx.objectStore(ASSET_STORE);
      const req = store.put(asset);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[Assets] IndexedDB save fallback to memory cache:', err);
  }
}

/**
 * Retrieve a project asset by ID
 */
export async function getAsset(id: string): Promise<ProjectAsset | null> {
  try {
    const cachedData = memoryCache.get(id);
    const db = await initAssetDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ASSET_STORE, 'readonly');
      const store = tx.objectStore(ASSET_STORE);
      const req = store.get(id);
      req.onsuccess = () => {
        const result = req.result as ProjectAsset | undefined;
        if (result) {
          memoryCache.set(result.id, result.data);
          resolve(result);
        } else if (cachedData) {
          resolve({
            id,
            name: 'cached-asset',
            mimeType: 'image/png',
            data: cachedData,
            size: cachedData.length,
            createdAt: Date.now(),
          });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[Assets] IndexedDB get fallback:', err);
    const cached = memoryCache.get(id);
    if (cached) {
      return {
        id,
        name: 'cached-asset',
        mimeType: 'image/png',
        data: cached,
        size: cached.length,
        createdAt: Date.now(),
      };
    }
    return null;
  }
}

/**
 * Load all project assets from IndexedDB into memory map
 */
export async function getAllAssets(): Promise<Record<string, ProjectAsset>> {
  try {
    const db = await initAssetDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ASSET_STORE, 'readonly');
      const store = tx.objectStore(ASSET_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result || []) as ProjectAsset[];
        const map: Record<string, ProjectAsset> = {};
        list.forEach((item) => {
          map[item.id] = item;
          memoryCache.set(item.id, item.data);
        });
        resolve(map);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[Assets] getAllAssets error:', err);
    return {};
  }
}

/**
 * Bulk save multiple assets into IndexedDB (used during project import or restore)
 */
export async function saveAllAssets(assets: Record<string, ProjectAsset>): Promise<void> {
  if (!assets || Object.keys(assets).length === 0) return;
  try {
    const db = await initAssetDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ASSET_STORE, 'readwrite');
      const store = tx.objectStore(ASSET_STORE);
      Object.values(assets).forEach((asset) => {
        memoryCache.set(asset.id, asset.data);
        store.put(asset);
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[Assets] Bulk saveAllAssets error:', err);
  }
}

/**
 * Memory cache getter & setter for instantaneous synchronous rendering
 */
export function getCachedAssetDataUrl(assetId: string): string | null {
  return memoryCache.get(assetId) || null;
}

export function setCachedAssetDataUrl(assetId: string, dataUrl: string): void {
  memoryCache.set(assetId, dataUrl);
}

/**
 * Import local image file, compute dimensions, store in IndexedDB and memory cache
 */
export function importLocalImageFile(file: File): Promise<{
  assetId: string;
  dataUrl: string;
  width: number;
  height: number;
  name: string;
  size: number;
  mimeType: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();

      img.onload = async () => {
        const assetId = `asset-img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const asset: ProjectAsset = {
          id: assetId,
          name: file.name,
          mimeType: file.type || 'image/png',
          data: dataUrl,
          size: file.size,
          width: img.naturalWidth || 400,
          height: img.naturalHeight || 300,
          createdAt: Date.now(),
        };

        await saveAsset(asset);

        resolve({
          assetId,
          dataUrl,
          width: img.naturalWidth || 400,
          height: img.naturalHeight || 300,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'image/png',
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to decode image data.'));
      };

      img.src = dataUrl;
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
