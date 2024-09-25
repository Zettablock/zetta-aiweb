/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosInterceptorOptions, AxiosRequestConfig } from 'axios';
import { RequestPlugin } from './BasePlugin';
import { getCurrentPlatform } from '../../sniffer';

export class RiskRequestPlugin extends RequestPlugin {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static getRiskInfo = (config: AxiosRequestConfig) => ({})

  constructor(
    public options: AxiosInterceptorOptions & {
      riskHeaderName?: string;
      getRiskInfo?: (config: AxiosRequestConfig) => Promise<any>;
    }
  ) {
    super(options);
  }

  public handle = async <V extends AxiosRequestConfig>(value: V) => {
    if (getCurrentPlatform().isNativePlatform) return value;

    const riskHeaderName =
      (value as any).riskHeaderName || this.options.riskHeaderName;

      const getRiskInfo = this.options.getRiskInfo || RiskRequestPlugin.getRiskInfo
    if (getRiskInfo) {
      if (riskHeaderName && value.headers && value.headers[riskHeaderName]) {
        return value;
      }
      const headers = await getRiskInfo(value);
      value.headers = {
        ...value.headers,
        ...headers,
      };
    }
    return value;
  };
}
