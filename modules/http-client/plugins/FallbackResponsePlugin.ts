/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AxiosError,
  AxiosInterceptorOptions,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { ResponsePlugin } from './BasePlugin';
import { getCurrentPlatform, isThirdWebview } from '../../sniffer';

const API_FALLBACK_SOURCE = '__API_FALLBACK_SOURCE__';

export class FallbackResponsePlugin extends ResponsePlugin {
  constructor(
    public options: AxiosInterceptorOptions & {
      fallbackHeaderName?: string;
      fallback?: (config: AxiosRequestConfig) => any;
    }
  ) {
    super(options);
  }

  public handle = <V extends AxiosResponse = AxiosResponse>(
    response: V,
    error?: AxiosError
  ) => {
    const fallbackHeaderName =
      (response.config as any).fallbackHeaderName ||
      this.options.fallbackHeaderName;
    if (
      this.options.fallback &&
      fallbackHeaderName &&
      response.config.headers![fallbackHeaderName]
    ) {
      const { config } = response;
      const fallbackSource =
        (typeof window !== 'undefined' &&
          (window as any)[API_FALLBACK_SOURCE]) ||
        {};
      const method = config.method || 'get';
      const apiName = `${method.toLocaleUpperCase()} ${
        config.url?.split('?')[0]
      }`;
      fallbackSource[apiName] = {
        ...fallbackSource[apiName],
        fallbackCount: (fallbackSource[apiName]?.fallbackCount || 0) + 1,
      };
      return this.options.fallback(config);
    }
    if (error) {
      throw error;
    }
    return response;
  };

  public handleError = (error: AxiosError<any, any>) => {
    const { response } = error;
    if (
      getCurrentPlatform().isNativePlatform ||
      isThirdWebview() ||
      (response && response?.status < 500)
    ) {
      throw error;
    }
    if (response) {
      return this.handle(response, error) as never;
    }
    throw error;
  };
}
