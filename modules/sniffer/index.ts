import { BasePlatform } from './BasePlatform'
import { NativePlatform } from './NativePlatform'
import { getPlatformByUa, PLATFORM } from './util'

export * from './util'

const cachedUA = [] as string[]
const cachedPlatformByUa = new Map()

function cachePlatformByUa(ua: string, platform: BasePlatform) {
  cachedUA.push(ua)
  cachedPlatformByUa.set(ua, platform)
  if (cachedUA.length > 10) {
    const uaForRemove = cachedUA.shift()
    cachedPlatformByUa.delete(uaForRemove)
  }
}

export function getPlatform(ua = '') {
  if (cachedPlatformByUa.has(ua)) {
    return cachedPlatformByUa.get(ua)
  }
  const platform = getPlatformByUa(ua)
  let platformInstance
  switch (platform) {
    case PLATFORM.NativeAndroid:
    case PLATFORM.NativeIOS:
      platformInstance = new NativePlatform(ua)
      break
    default:
      platformInstance = new BasePlatform(ua)
  }
  cachePlatformByUa(ua, platformInstance)
  return platformInstance
}

export function getCurrentPlatform() {
  if (!process.env.BROWSER) {
    console.warn(
      '[] [] [] [] [platform] [] [] [',
      new Error(`getCurrentPlatform can't be called on the server side`),
      '][] [] [] []'
    ) // eslint-disable-line no-console
    return
  }
  const currentUA = window.navigator.userAgent
  return getPlatform(currentUA)
}
