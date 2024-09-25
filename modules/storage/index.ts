import localforage from 'localforage'

export const STORAGE_STRATEGY_KEY = '__storage_strategy_key__'

enum StorageStrategy {
  Lru,
  Clear
}

export const storageStrategyPromise = new Promise<
  Record<string, StorageStrategy>
>(async resolve => {
  const storageStrategy =
    await localforage.getItem<Record<string, StorageStrategy>>(
      STORAGE_STRATEGY_KEY
    )
  resolve(storageStrategy ?? {})
})

export async function updateStorageStrategy(
  key: string,
  strategy?: StorageStrategy
) {
  const storageStrategy = await storageStrategyPromise
  if (strategy) {
    delete storageStrategy[key]
    await localforage.setItem(STORAGE_STRATEGY_KEY, storageStrategy)
  } else {
    await localforage.setItem(STORAGE_STRATEGY_KEY, {
      ...storageStrategy,
      [key]: strategy
    })
  }
}

export function getStorage(options: LocalForageOptions, namespace?: string) {
  const storage = localforage.createInstance(options)
  if (namespace) {
    const lruInstances = {} as Record<string, any>

    const storageProxy: LocalForageDbMethodsCore = {
      async clear(callback) {
        return await storage.clear(callback)
      },
      async getItem(_key, callback) {
        const key = `${namespace}${_key}`
        const storageStrategy = await storageStrategyPromise
        // TODO strategy
        if (storageStrategy[key] === StorageStrategy.Clear) {
          await updateStorageStrategy(key)
          return null
        }
        // else if (storageStrategy[key] === StorageStrategy.Lru) {
        //   if (!lruInstances[key]) {
        //     lruInstances[key] =
        //   }
        // }
        return await storage.getItem(key, callback)
      },
      async setItem<T>(
        _key: string,
        value: T,
        callback?: ((err: any, value: T) => void) | StorageStrategy
      ) {
        const key = `${namespace}${_key}`
        if (typeof callback !== 'function') {
          callback = undefined
        }
        // TODO StorageStrategy

        return await storage.setItem(key, value, callback)
      },
      async iterate(iteratorCallback, successCallback) {
        return await storage.iterate(
          (value: any, _key: string, iterationNumber: number) => {
            const key = `${namespace}${_key}`
            return iteratorCallback(value, key, iterationNumber)
          },
          successCallback
        )
      },
      async key(n, callback) {
        return await storage.key(n, (err, _key) => {
          const key = `${namespace}${_key}`
          return callback && callback(err, key)
        })
      },
      async keys(callback) {
        return await storage.keys((err, _keys) => {
          const keys = _keys.map(_key => `${namespace}${_key}`)
          return callback && callback(err, keys)
        })
      },
      async length(callback) {
        return await storage.length(callback)
      },
      async removeItem(_key, callback) {
        const key = `${namespace}${_key}`
        return await storage.removeItem(key, callback)
      }
    }

    return storageProxy
  }
}
