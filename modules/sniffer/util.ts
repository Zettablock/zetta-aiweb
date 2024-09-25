export const REG = {
  Ios: /iphone|ipad|ipod/i,
  IosVersion: /os (\d+)_(\d+)_?(\d+)?/i,
  Android: /Android/i,
  AndroidVersion: /Android (\d+).?(\d+)?.?(\d+)?/i,
  AndroidNative: /\s([a-z]h{2})_android_version\//i,
  IosNative: /\s([a-z]h{2})_ios_version\//i,
  IosApiRequest: /BundleID\/com.einnovation.app/i,
  Mobile: /Android|webOS|iPhone|iPad|iPod/i,
  AndroidNativeVersion: /(([a-z]h{2})_android_version)\/([^\s]+)\s*/i,
  IosNativeVersion: /(([a-z]h{2})_ios_version|AppVersion)\/([^\s]+)\s*/i,
  MecoWebViewCore: /MecoCore\/(\d)/i,
  MecoWebViewSdk: /MecoSDK\/(\d)/i,
  Crawler: /\+http|Chrome-Lighthouse|Google-InspectionTool/
}

export const PLATFORM_REG = {
  // https://github.com/f2etw/detect-inapp
  Messenger: /\bFB[\w_]+\/(Messenger|MESSENGER)/,
  // https://mpulp.mobi/2012/01/17/funky-user-agent-on-facebook-iphone-app/
  Facebook: /\bFB[\w_]+\//,
  Twitter: /\bTwitter/i,
  Line: /\bLine\//i,
  Instagram: /\bInstagram/i,
  Whatsapp: /\bWhatsApp/i,
  Snapchat: /Snapchat/i,
  Tiktok: /musical_ly/i,
  Pinterest: /Pinterest/i
}

type Platform_Type = keyof typeof PLATFORM_REG

// https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Browser_detection_using_the_user_agent
export const BROWSER_REG = {
  Opera: /\b(OPR|Opera)\//i,
  Edge: /\bEdg(e|A|iOS)?\//i,
  Firefox: /\b(Firefox|FxiOS)\//i,
  Chrome: /\b(Chrome|CriOS)\//i,
  Safari: /\bSafari\//i
}

type Browser_Type = keyof typeof BROWSER_REG

const NORMAL_BROWSER_PLATFORM_REG = /\bMozilla/i

export const PLATFORM = {
  Unknown: 'unknown',
  Browser: 'browser',
  NativeIOS: 'ios',
  NativeAndroid: 'android',
  Messenger: 'messenger',
  Facebook: 'facebook',
  Twitter: 'twitter',
  Line: 'line',
  Instagram: 'instagram',
  Whatsapp: 'whatsapp',
  Snapchat: 'snapchat',
  Tiktok: 'tiktok',
  Pinterest: 'pinterest'
}

export const BROWSER = {
  Chrome: 'chrome',
  Safari: 'safari',
  Edge: 'edge',
  Firefox: 'firefox',
  Opera: 'opera',
  Unknown: 'unknown'
}

export const SYSTEM = {
  Android: 'android',
  IOS: 'ios',
  Unknown: 'unknown'
}

export function getNativeVersion(ua: string, platform: string) {
  const regNativeVersion =
    platform === PLATFORM.NativeAndroid
      ? REG.AndroidNativeVersion
      : REG.IosNativeVersion
  const matchVersions = ua.match(regNativeVersion)
  if (matchVersions) {
    return matchVersions[3] || ''
  }
  return ''
}

export function isMecoWebView(ua: string) {
  return REG.MecoWebViewCore.test(ua) && REG.MecoWebViewSdk.test(ua)
}

export function isWebBundle() {
  return (
    typeof window !== 'undefined' && window.location.protocol === 'amcomponent:'
  )
}

export function getPlatformByUa(ua = '') {
  if (REG.AndroidNative.test(ua)) {
    return PLATFORM.NativeAndroid
  }
  if (REG.IosNative.test(ua) || REG.IosApiRequest.test(ua)) {
    return PLATFORM.NativeIOS
  }

  for (let key in PLATFORM_REG) {
    if (PLATFORM_REG[key as Platform_Type].test(ua)) {
      return PLATFORM[key as Platform_Type]
    }
  }

  if (NORMAL_BROWSER_PLATFORM_REG.test(ua)) {
    return PLATFORM.Browser
  }

  return PLATFORM.Unknown
}

export function getBrowser(ua = '') {
  const browser = Object.keys(BROWSER_REG).find(key =>
    BROWSER_REG[key as Browser_Type].test(ua)
  )
  return BROWSER[browser as Browser_Type] || BROWSER.Unknown
}

export function getSystem(ua = '') {
  if (REG.Ios.test(ua)) {
    return SYSTEM.IOS
  }
  if (REG.Android.test(ua)) {
    return SYSTEM.Android
  }
  return SYSTEM.Unknown
}

export function getSystemVersion(ua = '') {
  const system = getSystem(ua)
  let regSystemVersion!: RegExp
  if (system === SYSTEM.IOS) {
    regSystemVersion = REG.IosVersion
  }
  if (system === SYSTEM.Android) {
    regSystemVersion = REG.AndroidVersion
  }
  if (regSystemVersion) {
    const SystemVersions = ua.match(regSystemVersion)
    const formatVersions = SystemVersions
      ? [SystemVersions[1], SystemVersions[2], SystemVersions[3]].map(
          version => {
            return version ? parseInt(version, 10) : 0
          }
        )
      : []
    return formatVersions.join('.')
  }
  return ''
}

export function unifyUa(ua = '') {
  return (
    (!ua && typeof window !== 'undefined' ? window.navigator.userAgent : ua) ||
    ''
  )
}

export function isMobilePlatform(ua = '') {
  return REG.Mobile.test(unifyUa(ua))
}

export function isCrawler(ua = '') {
  return REG.Crawler.test(unifyUa(ua))
}

export function isThirdWebview(ua = '') {
  return unifyUa(ua).includes('x_third_web')
}

export function inPWA() {
  if (window.matchMedia(`(display-mode: fullscreen)`).matches) {
    return location.search.includes('_x_from=pwa')
  }
  return ['standalone', 'minimal-ui'].some(
    d => window.matchMedia(`(display-mode: ${d})`).matches
  )
}
