/**
 * IndexedDB-backed persistent cache for row data.
 * Survives Obsidian restarts. Uses mtime fingerprint for auto-invalidation.
 */
import { RowDataType, TableColumn } from "cdm/FolderModel";
import { TFile, parseYaml } from "obsidian";
import { MetadataColumns } from "helpers/Constants";
import { LOGGER } from "services/Logger";
import { RowCacheService } from "services/RowCacheService";

const DB_NAME = "gewu-persistent-cache";
const DB_VERSION = 1;
const STORE_NAME = "rows";
const CACHE_VERSION = 1;

interface CacheEntry {
  version: number;
  mtime: number;
  row: RowDataType;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

function makeKey(dbPath: string, filePath: string): string {
  return `${dbPath}::${filePath}`;
}

export class PersistentCacheService {
  private static dbPath: string = "";
  private static columns: TableColumn[] = [];

  static init(dbPath: string, columns: TableColumn[]) {
    this.dbPath = dbPath;
    this.columns = columns;
  }

  static getKey(filePath: string): string {
    return makeKey(this.dbPath, filePath);
  }

  /** Store a single parsed row in IndexedDB */
  static async set(filePath: string, mtime: number, row: RowDataType): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const entry: CacheEntry = { version: CACHE_VERSION, mtime, row };
      store.put(entry, makeKey(this.dbPath, filePath));
      db.close();
    } catch {
      // IndexedDB full or unavailable — silently degrade
    }
  }

  /** Get a single cached row. Returns null if missing or stale (mtime mismatch). */
  static async get(filePath: string, mtime: number): Promise<RowDataType | null> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      return new Promise((resolve) => {
        const req = store.get(makeKey(this.dbPath, filePath));
        req.onsuccess = () => {
          db.close();
          const entry = req.result as CacheEntry | undefined;
          if (!entry) return resolve(null);
          if (entry.version !== CACHE_VERSION) return resolve(null);
          if (entry.mtime !== mtime) return resolve(null);
          resolve(entry.row);
        };
        req.onerror = () => { db.close(); resolve(null); };
      });
    } catch {
      return null;
    }
  }

  /**
   * Bulk load all cached rows for this database.
   * Returns a Map<filePath, { mtime, row }>
   */
  static async loadAll(scopePrefix: string): Promise<Map<string, { mtime: number; row: RowDataType }>> {
    const result = new Map<string, { mtime: number; row: RowDataType }>();
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      return new Promise((resolve) => {
        const req = store.openCursor();
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            const key = cursor.key as string;
            if (key.startsWith(scopePrefix)) {
              const entry = cursor.value as CacheEntry;
              if (entry.version === CACHE_VERSION) {
                const filePath = key.slice(scopePrefix.length + 2); // strip "dbPath::"
                result.set(filePath, { mtime: entry.mtime, row: entry.row });
              }
            }
            cursor.continue();
          } else {
            db.close();
            resolve(result);
          }
        };
        req.onerror = () => { db.close(); resolve(result); };
      });
    } catch {
      return result;
    }
  }

  /** Invalidate (delete) a single cached entry */
  static async invalidate(filePath: string): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(makeKey(this.dbPath, filePath));
      db.close();
    } catch { /* silent */ }
  }

  /** Invalidate all entries for this database */
  static async clearAll(): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const prefix = makeKey(this.dbPath, "");
      return new Promise((resolve) => {
        const req = store.openCursor();
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            if ((cursor.key as string).startsWith(prefix)) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            db.close();
            resolve();
          }
        };
        req.onerror = () => { db.close(); resolve(); };
      });
    } catch { /* silent */ }
  }

  /**
   * Build a row from a file and its cached metadata (no disk I/O).
   */
  static buildRowFromCache(file: TFile, fm: Record<string, any>, columns: TableColumn[]): RowDataType {
    const row: RowDataType = {
      __note__: undefined,
      [MetadataColumns.FILE]: app.metadataCache.fileToLinktext(file, file.path, false),
      [MetadataColumns.CREATED]: file.stat.ctime,
      [MetadataColumns.MODIFIED]: file.stat.mtime,
      [MetadataColumns.TASKS]: [],
      [MetadataColumns.OUTLINKS]: [],
      [MetadataColumns.INLINKS]: [],
      [MetadataColumns.TAGS]: [],
    };

    for (const col of columns) {
      if (fm[col.key] !== undefined) {
        row[col.key] = fm[col.key];
      }
    }

    RowCacheService.set(file.path, file.stat.mtime, row);
    this.set(file.path, file.stat.mtime, row); // fire-and-forget to IndexedDB
    return row;
  }
}
