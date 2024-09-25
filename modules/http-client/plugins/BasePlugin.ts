/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable class-methods-use-this */
// eslint-disable-next-line max-classes-per-file
import {
  AxiosError,
  AxiosInterceptorOptions,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

export interface IBasePlugin {
  new (options: AxiosInterceptorOptions): any;
}

export class BasePlugin {
  // eslint-disable-next-line no-useless-constructor
  constructor(public options: AxiosInterceptorOptions) {}

  public handle = (value: any): any | Promise<any> => {
    return value;
  };

  public handleError = (error: any) => {
    throw error;
  };
}

export class RequestPlugin extends BasePlugin {
  public handle = <V extends AxiosRequestConfig>(value: V): V | Promise<V> => {
    return value;
  };

  public handleError = (error: Error) => {
    throw error;
  };
}

export class ResponsePlugin extends BasePlugin {
  public handle = <V extends AxiosResponse = AxiosResponse>(
    value: V
  ): V | Promise<V> => {
    return value;
  };

  public handleError = (error: AxiosError<any, any>) => {
    throw error;
  };
}
