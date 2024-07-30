import localforage from 'localforage'

export const STORAGE_STRATEGY_KEY = '__storage_strategy_key__'

enum StorageStrategy {
    Lru,
    Ahead,
    Clear
}

export const storageStrategyPromise = new Promise<Record<string, StorageStrategy>>(async (resolve) => {
    const storageStrategy = await localforage.getItem<Record<string, StorageStrategy>>(STORAGE_STRATEGY_KEY)
    resolve(storageStrategy ?? {})
})

export async function updateStorageStrategy(key: string, strategy: StorageStrategy) {
    const storageStrategy = await storageStrategyPromise
    await localforage.setItem(STORAGE_STRATEGY_KEY, {...storageStrategy, [key]: strategy})
}

export async function deleteStorageStrategy(key: string) {
    const storageStrategy = await storageStrategyPromise
    delete storageStrategy[key]
    await localforage.setItem(STORAGE_STRATEGY_KEY, storageStrategy)
}

export const storage = {
    async clear(callback) {
        return await localforage.clear(callback)
    },
    async getItem(key, callback) {
        const storageStrategy = await storageStrategyPromise
        // TODO strategy
        if (storageStrategy[key] === StorageStrategy.Clear) {
            delete storageStrategy[key]
            return undefined
        }
        return await localforage.getItem(key, callback)
    },
    async setItem<T>(key: string, value: T, callback?: ((err: any, value: T) => void) | StorageStrategy) {
        if (typeof callback !== 'function') {
            callback = undefined
        }
        return await localforage.setItem(key, value, callback)
    },
    async iterate(iteratorCallback, successCallback) {
        return await localforage.iterate(iteratorCallback, successCallback)
    },    
    async key(n, callback) {
        return await localforage.key(n, callback)
    },
    async keys(callback) {
        return await localforage.keys(callback)
    },
    async length(callback) {
        return await localforage.length(callback)
    },
    async removeItem(key, callback) {
        return await localforage.removeItem(key, callback)
    },
} as LocalForageDbMethodsCore