import { TokenRequestPlugin } from './TokenRequestPlugin';
import { ErrorResponsePlugin } from './ErrorResponsePlugin';
import { FallbackResponsePlugin } from './FallbackResponsePlugin';
import { ForwardRequestPlugin } from './ForwardRequestPlugin';
import { RiskRequestPlugin } from './RiskRequestPlugin';
import { Axios } from 'axios';
import { BasePlugin, RequestPlugin } from './BasePlugin';
import { ValidateResponsePlugin } from './ValidateResponsePlugin';

export const Plugins = {
  TokenRequestPlugin,
  ForwardRequestPlugin,
  RiskRequestPlugin,
  ErrorResponsePlugin,
  FallbackResponsePlugin,
  ValidateResponsePlugin,
};

export const applyPlugins = (
  httpClient: Axios,
  pluginModules: BasePlugin[]
) => {
  pluginModules.forEach((plugin) => {
    if (plugin instanceof RequestPlugin) {
      httpClient.interceptors.request.use(
        plugin.handle,
        plugin.handleError,
        plugin.options
      );
    } else {
      httpClient.interceptors.response.use(
        plugin.handle,
        plugin.handleError,
        plugin.options
      );
    }
  });
};
