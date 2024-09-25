/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosError, AxiosInterceptorOptions, AxiosResponse } from 'axios';
import { ResponsePlugin } from './BasePlugin';

function defaultErrorValidator(data: any) {
  return !data || !!data.error;
}

function defaultErrorHandler(error: AxiosError) {
  const data = error.response?.data || ({} as any);
  if (data.error) {
    // eslint-disable-next-line no-console
    console.error(data.error);
  }
  
  throw error
}

export class ErrorResponsePlugin extends ResponsePlugin {
  constructor(
    public options: AxiosInterceptorOptions & {
      errorValidator?: typeof defaultErrorValidator;
      errorHandler?: (error: AxiosError) => never;
    }
  ) {
    options.errorValidator = options.errorValidator || defaultErrorValidator;
    options.errorHandler = options.errorHandler || (defaultErrorHandler as any);
    super(options);
  }

  public handle = <V extends AxiosResponse = AxiosResponse>(response: V) => {
    const { data, config, request } = response;
    const errorValidator =
      (config as any).errorValidator || this.options.errorValidator;
    const errorHandler =
      (config as any).errorHandler || this.options.errorHandler;

    if (errorValidator!(data)) {
      const message = data.error_msg || 'response struct error';
      const error = new AxiosError(
        message,
        data.error_code || 'response_struct_error',
        config,
        request,
        response
      );

      if (errorHandler) {
        return errorHandler(error);
      }
      throw error;
    }
    return response;
  };

  public handleError = (error: AxiosError<any, any>) => {
    if (!(error instanceof AxiosError)) {
      throw new AxiosError((error as any).message, 'response_proccess_error');
    }
    if (!error.response) throw error;
    const { data } = error.response;
    if (this.options.errorValidator!(data)) {
      const axiosError = new AxiosError(
        error.message,
        data.error_code || 'response_struct_error',
        error.config,
        error.request,
        error.response
      );

      if (this.options.errorHandler) {
        return this.options.errorHandler(axiosError);
      }
      throw axiosError;
    }
    throw error;
  };
}
