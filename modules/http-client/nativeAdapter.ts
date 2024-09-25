/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AxiosError,
  AxiosHeaders,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import settle from 'axios/unsafe/core/settle';
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import resolveConfig from 'axios/unsafe/helpers/resolveConfig';
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import utils from 'axios/unsafe/utils';
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import composeSignals from 'axios/unsafe/helpers/composeSignals';

const resolvers = {} as any;

((res: any) => {
  ['text', 'arrayBuffer', 'blob', 'formData', 'stream'].forEach((type) => {
    // eslint-disable-next-line no-unused-expressions
    !resolvers[type] &&
      (resolvers[type] = utils.isFunction(res[type])
        ? (_res: any) => _res[type]()
        : (_: any, config: InternalAxiosRequestConfig) => {
            throw new AxiosError(
              `Response type '${type}' is not supported`,
              AxiosError.ERR_NOT_SUPPORT,
              config
            );
          });
  });
})(new Response());

export async function nativeAdapter(
  originConfig: AxiosRequestConfig & {
    callNative: (request: Request) => Promise<any>;
  }
) {
  const { url, method, data, signal, cancelToken, timeout, headers } =
    resolveConfig(originConfig);

  const [composedSignal, stopTimeout] =
    signal || cancelToken || timeout
      ? composeSignals([signal, cancelToken], timeout)
      : [];

  let finished: boolean;
  const onFinish = () => {
    // eslint-disable-next-line no-unused-expressions
    !finished &&
      setTimeout(() => {
        // eslint-disable-next-line no-unused-expressions
        composedSignal && composedSignal.unsubscribe();
      });

    finished = true;
  };
  const request = new Request(url, {
    signal: composedSignal,
    method: method.toUpperCase(),
    headers: headers.normalize().toJSON(),
    body: data,
  });

  try {
    const res = await originConfig.callNative(request);
    const response = {
      status: res.statusCode,
      statusText: res.statusMessage,
      headers: new AxiosHeaders(res.headers),
      config: originConfig,
      request,
    };

    const responseType = originConfig.responseType || 'text';

    const responseData = await resolvers[
      utils.findKey(resolvers, responseType) || 'text'
    ](response, originConfig);

    if (stopTimeout) {
      stopTimeout();
    }

    return await new Promise((resolve, reject) => {
      settle(resolve, reject, {
        data: responseData,
        headers: AxiosHeaders.from(response.headers),
        status: response.status,
        statusText: response.statusText,
        originConfig,
        request,
      });
    });
  } catch (err: any) {
    onFinish();

    if (err && err.name === 'TypeError' && /fetch/i.test(err.message)) {
      throw Object.assign(
        new AxiosError(
          'Network Error',
          AxiosError.ERR_NETWORK,
          originConfig as any,
          request
        ),
        {
          cause: err.cause || err,
        }
      );
    }

    throw AxiosError.from(err, err && err.code, originConfig as any, request);
  }
}
