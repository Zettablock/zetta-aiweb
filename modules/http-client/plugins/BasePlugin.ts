import {
  Axios,
  AxiosError,
  AxiosInterceptorOptions,
  AxiosRequestConfig,
  AxiosResponse
} from 'axios'

export interface IBasePlugin {
  new (options: AxiosInterceptorOptions): any
}

export class BasePlugin {
  constructor(public options: AxiosInterceptorOptions) {}

  public handle(value: any): any | Promise<any> {
    return value
  }

  public handleError(error: any): any {
    throw error
  }
}

export class RequestPlugin extends BasePlugin {
  public handle<V extends AxiosRequestConfig>(value: V): V | Promise<V> {
    return value
  }
  public handleError(error: Error) {
    throw error
  }
}

export class ResponsePlugin extends BasePlugin {
  public handle<V extends AxiosResponse = AxiosResponse>(
    value: V
  ): V | Promise<V> {
    return value
  }
  public handleError(error: AxiosError) {
    throw error
  }
}
