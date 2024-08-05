import { join } from 'path-browserify'

export function resolvePublicPath(relativePath: string) {
  const realPath = join(process.env.NEXT_PUBLIC_BASEPATH || '', relativePath)
  if (typeof window === 'undefined') {
    return realPath
  }
  const webviewPublicPath =
    ((window as any).__webpack_public_path__ as string) ?? ''

  return webviewPublicPath
    ? join(webviewPublicPath, relativePath)
    : relativePath
}
