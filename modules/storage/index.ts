import localforage from 'localforage'
import { useEffect, useState } from 'react'

export const STORAGE_STRATEGY_KEY = '__storage_strategy_key__'

enum StorageStrategy {
  Lru,
  Clear
}

export const storageStrategyPromise = new Promise<
  Record<string, StorageStrategy>
  // eslint-disable-next-line no-async-promise-executor
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

export function getStorage(options: LocalForageOptions) {
  const storage = localforage.createInstance(options)
  const namespace = options.name || 'default'
  if (namespace) {
    // const lruInstances = {} as Record<string, any>;

    const storageProxy: LocalForageDbMethodsCore = {
      async clear(callback) {
        const result = await storage.clear(callback)
        return result
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
        const result = await storage.getItem(key, callback)
        return result
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

        const result = await storage.setItem(key, value, callback)
        return result
      },
      async iterate(iteratorCallback, successCallback) {
        const result = await storage.iterate(
          (value: any, _key: string, iterationNumber: number) => {
            const key = `${namespace}${_key}`
            return iteratorCallback(value, key, iterationNumber)
          },
          successCallback
        )
        return result
      },
      async key(n, callback) {
        const result = await storage.key(n, (err, _key) => {
          const key = `${namespace}${_key}`
          return callback && callback(err, key)
        })
        return result
      },
      async keys(callback) {
        const result = await storage.keys((err, _keys) => {
          const keys = _keys.map(_key => `${namespace}${_key}`)
          return callback && callback(err, keys)
        })
        return result
      },
      async length(callback) {
        const result = await storage.length(callback)
        return result
      },
      async removeItem(_key, callback) {
        const key = `${namespace}${_key}`
        const result = await storage.removeItem(key, callback)
        return result
      }
    }

    return storageProxy
  }

  return storage
}

export const storage = getStorage({
  name: 'default'
})

export function useStorage(key: string, initialValue: any) {
  const [state, setState] = useState(initialValue)

  const handleChange = async (value: any) => {
    await storage.setItem(key, value)
    setState(value)
  }

  useEffect(() => {
    if (state === initialValue) {
      storage.getItem(key, (err, value) => {
        if (!err) {
          setState(value)
        }
      })
    } else {
      handleChange(initialValue)
    }
  }, [initialValue])

  return [state, handleChange] as const
}
