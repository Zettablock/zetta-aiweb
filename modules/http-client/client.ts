/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  Axios,
  AxiosDefaults,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { nativeAdapter } from './nativeAdapter';

import { BasePlugin, IBasePlugin } from './plugins/BasePlugin';
import { Plugins, applyPlugins } from './plugins/index';
import { getCurrentPlatform } from '../sniffer';

const httpLibMethods = [
  'request',
  'get',
  'delete',
  'head',
  'options',
  'post',
  'put',
  'patch',
  'postForm',
  'putForm',
  'patchForm',
] as const;
export interface HttpClient {
  axios: Axios;
  defaults: AxiosDefaults;
  interceptors: Axios['interceptors'];
  getUri(config?: AxiosRequestConfig): string;
  request<T = any, R = T, D = any>(config: AxiosRequestConfig<D>): Promise<R>;
  get<T = any, R = T, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;
  delete<T = any, R = T, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;
  head<T = any, R = T, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;
  options<T = any, R = T, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;
  post<T = any, R = T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;
  put<T = any, R = T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;
  patch<T = any, R = T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;
  postForm<T = any, R = T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;
  putForm<T = any, R = T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;
  patchForm<T = any, R = T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;
}

export const getHttpClient = (
  config: AxiosRequestConfig,
  processData: (value: AxiosResponse) => AxiosResponse['data'],
  // eslint-disable-next-line default-param-last
  pluginsConfig = {} as Record<
    string,
    {
      enable?: boolean;
      Provider?: IBasePlugin;
      options?: any;
    }
  >
) => {
  const { isNativePlatform, isTinyNativePlatform } = getCurrentPlatform();
  const isNative = isNativePlatform || isTinyNativePlatform;
  if (!config.adapter) {
    if (isNative) {
      config.adapter = nativeAdapter as any;
    }
    //  else {
    //   config.adapter = ['fetch', 'http', 'xhr'];
    // }
  }
  const axiosInstance = axios.create(config);
  const plugins = [] as BasePlugin[];
  Object.keys(pluginsConfig).forEach((key) => {
    const pluginModule = pluginsConfig[key];
    if (pluginModule.enable !== false) {
      if (pluginModule.Provider) {
        plugins.push(new pluginModule.Provider(pluginModule.options ?? {}));
      } else if ((Plugins as any)[key]) {
        plugins.push(new (Plugins as any)[key](pluginModule.options ?? {}));
      }
    }
  });
  applyPlugins(axiosInstance, plugins);

  const httpClient = {
    axios: axiosInstance,
    get defaults() {
      return axiosInstance.defaults;
    },
    get interceptors() {
      return axiosInstance.interceptors;
    },
    getUri(_config?: AxiosRequestConfig) {
      return axiosInstance.getUri(_config);
    },
  } as unknown as HttpClient;

  httpLibMethods.forEach((method) => {
    httpClient[method] = ((...args: any[]) => {
      return (axiosInstance as any)[method]
        .apply(axiosInstance, args)
        .then(processData);
    }) as any;
  });

  return httpClient;
};
