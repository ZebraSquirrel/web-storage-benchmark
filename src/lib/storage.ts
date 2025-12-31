import Dexie, { type Table } from 'dexie';
import store from 'store';
import PouchDBModule from 'pouchdb-browser';
// @ts-ignore
const PouchDB = PouchDBModule.default || PouchDBModule;

import localforage from 'localforage';

export interface StorageAdapter {
    name: string;
    write(key: string, value: string): Promise<void>;
    read(key: string): Promise<string | null>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}

export class LocalStorageAdapter implements StorageAdapter {
    name = 'localStorage';
    async write(key: string, value: string) {
        localStorage.setItem(key, value);
    }
    async read(key: string) {
        return localStorage.getItem(key);
    }
    async delete(key: string) {
        localStorage.removeItem(key);
    }
    async clear() {
        localStorage.clear();
    }
}

export class SessionStorageAdapter implements StorageAdapter {
    name = 'sessionStorage';
    async write(key: string, value: string) {
        sessionStorage.setItem(key, value);
    }
    async read(key: string) {
        return sessionStorage.getItem(key);
    }
    async delete(key: string) {
        sessionStorage.removeItem(key);
    }
    async clear() {
        sessionStorage.clear();
    }
}

export class IndexedDBAdapter implements StorageAdapter {
    name = 'IndexedDB';
    private dbName = 'benchmark_db';
    private storeName = 'entries';

    private async getDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = () => {
                request.result.createObjectStore(this.storeName);
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async write(key: string, value: string) {
        const db = await this.getDB();
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(value, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async read(key: string) {
        const db = await this.getDB();
        return new Promise<string | null>((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(key: string) {
        const db = await this.getDB();
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clear() {
        const db = await this.getDB();
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export class CacheStorageAdapter implements StorageAdapter {
    name = 'Cache Storage';
    private cacheName = 'benchmark_cache';

    async write(key: string, value: string) {
        const cache = await caches.open(this.cacheName);
        await cache.put(new Request(key), new Response(value));
    }

    async read(key: string) {
        const cache = await caches.open(this.cacheName);
        const response = await cache.match(new Request(key));
        return response ? await response.text() : null;
    }

    async delete(key: string) {
        const cache = await caches.open(this.cacheName);
        await cache.delete(new Request(key));
    }

    async clear() {
        await caches.delete(this.cacheName);
    }
}

export class CookieAdapter implements StorageAdapter {
    name = 'Cookies';

    async write(key: string, value: string) {
        document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; Max-Age=3600`;
    }

    async read(key: string) {
        const nameEQ = encodeURIComponent(key) + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    }

    async delete(key: string) {
        document.cookie = `${encodeURIComponent(key)}=; path=/; Max-Age=-99999999;`;
    }

    async clear() {
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            const key = ca[i].split('=')[0].trim();
            await this.delete(key);
        }
    }
}

export class DexieAdapter implements StorageAdapter {
    name = 'Dexie.js';
    private db: Dexie & { entries: Table<{ key: string; value: string }, string> };

    constructor() {
        this.db = new Dexie('dexie_benchmark') as any;
        this.db.version(1).stores({
            entries: 'key'
        });
    }

    async write(key: string, value: string) {
        await this.db.entries.put({ key, value });
    }

    async read(key: string) {
        const entry = await this.db.entries.get(key);
        return entry ? entry.value : null;
    }

    async delete(key: string) {
        await this.db.entries.delete(key);
    }

    async clear() {
        await this.db.entries.clear();
    }
}

export class StoreJsAdapter implements StorageAdapter {
    name = 'store.js';

    async write(key: string, value: string) {
        store.set(key, value);
    }

    async read(key: string) {
        return store.get(key) || null;
    }

    async delete(key: string) {
        store.remove(key);
    }

    async clear() {
        store.clearAll();
    }
}

export class PouchDBAdapter implements StorageAdapter {
    name = 'PouchDB';
    private db: PouchDB.Database;

    constructor() {
        this.db = new PouchDB('pouch_benchmark');
    }

    async write(key: string, value: string) {
        try {
            const doc = await this.db.get(key);
            await this.db.put({ ...doc, value });
        } catch (e: any) {
            if (e.status === 404) {
                await this.db.put({ _id: key, value });
            } else {
                throw e;
            }
        }
    }

    async read(key: string) {
        try {
            const doc: any = await this.db.get(key);
            return doc.value;
        } catch (e: any) {
            if (e.status === 404) return null;
            throw e;
        }
    }

    async delete(key: string) {
        try {
            const doc = await this.db.get(key);
            await this.db.remove(doc);
        } catch (e: any) {
            if (e.status !== 404) throw e;
        }
    }

    async clear() {
        const allDocs = await this.db.allDocs();
        const deletions = allDocs.rows.map(row => ({
            _id: row.id,
            _rev: row.value.rev,
            _deleted: true
        }));
        await this.db.bulkDocs(deletions);
    }
}

export class LocalForageAdapter implements StorageAdapter {
    name = 'localForage';

    constructor() {
        localforage.config({ name: 'localforage_benchmark' });
    }

    async write(key: string, value: string) {
        await localforage.setItem(key, value);
    }

    async read(key: string) {
        return await localforage.getItem<string>(key);
    }

    async delete(key: string) {
        await localforage.removeItem(key);
    }

    async clear() {
        await localforage.clear();
    }
}

export class OPFSAdapter implements StorageAdapter {
    name = 'OPFS';

    private async getRoot() {
        if (!navigator.storage || !navigator.storage.getDirectory) {
            throw new Error('OPFS not supported');
        }
        return await navigator.storage.getDirectory();
    }

    async write(key: string, value: string) {
        const root = await this.getRoot();
        const fileHandle = await root.getFileHandle(key, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(value);
        await writable.close();
    }

    async read(key: string) {
        try {
            const root = await this.getRoot();
            const fileHandle = await root.getFileHandle(key);
            const file = await fileHandle.getFile();
            return await file.text();
        } catch (e) {
            return null;
        }
    }

    async delete(key: string) {
        const root = await this.getRoot();
        await root.removeEntry(key);
    }

    async clear() {
        const root = await this.getRoot();
        // @ts-ignore
        for await (const name of root.keys()) {
            await root.removeEntry(name, { recursive: true });
        }
    }
}
