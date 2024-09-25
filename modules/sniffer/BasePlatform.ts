/* eslint-disable class-methods-use-this */
import {
  getPlatformByUa,
  getSystemVersion,
  getSystem,
  getBrowser
} from './util'

export class BasePlatform {
  constructor(
    public ua = '',
    public cache = {} as any
  ) {
    this.ua = ua
  }

  public get platform() {
    return getPlatformByUa(this.ua)
  }

  public get browser() {
    return getBrowser(this.ua)
  }

  public get system() {
    return getSystem(this.ua)
  }

  public get systemVersion() {
    return getSystemVersion(this.ua)
  }

  public get version() {
    return ''
  }

  public get isNativePlatform() {
    return false
  }

  public get isMecoCore() {
    return false
  }
}
