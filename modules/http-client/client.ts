import axios, { AxiosRequestConfig } from 'axios'
import { getCurrentPlatform } from '@/modules/sniffer'
import { REGION_ID_MAP } from '@/modules/i18n'
import { nativeAdapter } from './nativeAdapter'

import { BasePlugin, IBasePlugin } from './plugins/BasePlugin'
import { Plugins, applyPlugins } from './plugins/index'

export const getHttpClient = (
  config: AxiosRequestConfig,
  pluginsConfig = {} as Record<
    string,
    {
      enable?: boolean
      Provider?: IBasePlugin
      options?: any
    }
  >,
  regionName?: string
) => {
  const { isNativePlatform, isTinyNativePlatform } = getCurrentPlatform()
  const isNative = isNativePlatform || isTinyNativePlatform
  if (!config.baseURL && regionName) {
    let baseURL = '/'
    if ((REGION_ID_MAP as any)[regionName]) {
      baseURL += regionName + '/'
    }
  }
  if (!config.adapter && isNative) {
    config.adapter = nativeAdapter as any
  }
  const httpClient = axios.create(config)
  const plugins = [] as BasePlugin[]
  Object.keys(pluginsConfig).forEach(key => {
    const pluginModule = pluginsConfig[key]
    if (pluginModule.enable !== false) {
      if (pluginModule.Provider) {
        plugins.push(new pluginModule.Provider(pluginModule.options))
      } else if ((Plugins as any)[key]) {
        plugins.push(new (Plugins as any)[key](pluginModule.options))
      }
    }
  })
  applyPlugins(httpClient, plugins)
  return httpClient
}
