/**
 * Frontmatter row cache - stores parsed rows in localStorage
 * Keyed by filepath + mtime, so cache auto-invalidates on file change
 */
import { RowDataType } from "cdm/FolderModel";
import { TFile } from "obsidian";
import { LOGGER } from "services/Logger";

const CACHE_PREFIX = "gewu_rowcache_";
const CACHE_VERSION = 1;

interface CacheEntry {
    version: number;
    mtime: number;
    rows: RowDataType[];
}

export class RowCacheService {
    private static dbPath: string = "";
    private static maxEntries: number = 2000;

    static init(databaseFilePath: string) {
        this.dbPath = databaseFilePath;
    }

    private static getCacheKey(file: TFile): string {
        return CACHE_PREFIX + this.dbPath + "_" + file.path;
    }

    static get(file: TFile): RowDataType[] | null {
        try {
            const key = this.getCacheKey(file);
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const entry: CacheEntry = JSON.parse(raw);
            if (entry.version !== CACHE_VERSION) return null;
            if (entry.mtime !== file.stat.mtime) return null;
            return entry.rows;
        } catch {
            return null;
        }
    }

    static set(file: TFile, rows: RowDataType[]) {
        try {
            const key = this.getCacheKey(file);
            const entry: CacheEntry = {
                version: CACHE_VERSION,
                mtime: file.stat.mtime,
                rows
            };
            localStorage.setItem(key, JSON.stringify(entry));
        } catch (e) {
            // localStorage full - clear old entries
            this.prune();
        }
    }

    static invalidate(file: TFile) {
        localStorage.removeItem(this.getCacheKey(file));
    }

    private static prune() {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith(CACHE_PREFIX)) keys.push(k);
        }
        // Remove oldest half
        keys.slice(0, Math.floor(keys.length / 2)).forEach(k => localStorage.removeItem(k));
        LOGGER.debug(`RowCache pruned ${Math.floor(keys.length / 2)} entries`);
    }

    /** Clear all cache for this database */
    static clearAll() {
        const prefix = CACHE_PREFIX + this.dbPath;
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k?.startsWith(prefix)) localStorage.removeItem(k);
        }
    }
}
