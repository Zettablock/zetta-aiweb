import { compareVersions } from 'compare-versions'
import { PLATFORM, getNativeVersion, isMecoWebView } from './util'

import { BasePlatform } from './BasePlatform'

export const VersionCompareMethod = {
  greaterThan: 'greaterThan',
  greaterThanEqual: 'greaterThanEqual',
  contains: 'contains'
}

export class NativePlatform extends BasePlatform {
  public isVersionGreater(version: string) {
    if (!version) {
      return false
    }
    return compareVersions(this.version, version) > 0
  }

  public isVersionGreaterThanEqual(version: string) {
    if (!version) {
      return false
    }
    return compareVersions(this.version, version) >= 0
  }

  public statisfy(
    androidVersion: string,
    iosVersion: string,
    compareMethod: string
  ) {
    if (compareMethod === VersionCompareMethod.greaterThan) {
      return this.platform === PLATFORM.NativeAndroid
        ? this.isVersionGreater(androidVersion)
        : this.isVersionGreater(iosVersion)
    }
    if (compareMethod === VersionCompareMethod.greaterThanEqual) {
      return this.platform === PLATFORM.NativeAndroid
        ? this.isVersionGreaterThanEqual(androidVersion)
        : this.isVersionGreaterThanEqual(iosVersion)
    }
    if (compareMethod === VersionCompareMethod.contains) {
      return this.platform === PLATFORM.NativeAndroid
        ? androidVersion.includes(this.version)
        : iosVersion.includes(this.version)
    }
    return false
  }

  public get version() {
    const version =
      this.cache.version || getNativeVersion(this.ua, this.platform)
    this.cache.version = version
    return version
  }

  public get isNativePlatform() {
    return (
      this.platform === PLATFORM.NativeIOS ||
      this.platform === PLATFORM.NativeAndroid
    )
  }

  public get isMecoCore() {
    const isMecoCore =
      this.cache.isMecoCore || (this.isNativePlatform && isMecoWebView(this.ua))
    this.cache.isMecoCore = isMecoCore
    return isMecoCore
  }
}
