/**
 * Frontmatter row cache - stores parsed rows in localStorage
 * Keyed by filepath + mtime, so cache auto-invalidates on file change
 */
import { RowDataType } from "cdm/FolderModel";
import { LOGGER } from "services/Logger";

const CACHE_PREFIX = "gewu_rowcache_";
const CACHE_VERSION = 1;

interface CacheEntry {
    version: number;
    mtime: number;
    rows: RowDataType;
}

export class RowCacheService {
    private static dbPath: string = "";

    static init(databaseFilePath: string) {
        this.dbPath = databaseFilePath;
    }

    private static getCacheKey(filepath: string): string {
        return CACHE_PREFIX + this.dbPath + "_" + filepath;
    }

    static get(filepath: string, mtime: number): RowDataType | null {
        try {
            const key = this.getCacheKey(filepath);
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const entry: CacheEntry = JSON.parse(raw);
            if (entry.version !== CACHE_VERSION) return null;
            if (entry.mtime !== mtime) return null;
            return entry.rows;
        } catch {
            return null;
        }
    }

    static set(filepath: string, mtime: number, rows: RowDataType) {
        try {
            const key = this.getCacheKey(filepath);
            const entry: CacheEntry = { version: CACHE_VERSION, mtime, rows };
            localStorage.setItem(key, JSON.stringify(entry));
        } catch {
            this.prune();
        }
    }

    private static prune() {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith(CACHE_PREFIX)) keys.push(k);
        }
        keys.slice(0, Math.floor(keys.length / 2)).forEach(k => localStorage.removeItem(k));
    }

    static clearAll() {
        const prefix = CACHE_PREFIX + this.dbPath;
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k?.startsWith(prefix)) localStorage.removeItem(k);
        }
    }
}
