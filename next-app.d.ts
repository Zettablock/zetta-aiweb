/// <reference types="localforage/typings/localforage.d.ts" />
/// <reference types="@segment/analytics-next/dist/types/index.d.ts" />
/// <reference types="rfdc/index.d.ts" />

declare module 'debug' {
  export default function createDebug(type: string) {
    return function debug(msg: string, ...args: any[]) {}
  }
}

declare module 'date-format' {
  export function asString(format: string | Date, date?: Date): string {}

  export function parse(
    pattern: string,
    str: string,
    missingValuesDate: number
  ): number {}
  export function now(): number {}
  export const ISO8601_FORMAT: string
  export const ISO8601_WITH_TZ_OFFSET_FORMAT: string
  export const ABSOLUTETIME_FORMAT: string
  export const DATETIME_FORMAT: string
}

declare module 'streamroller' {
  const content: any

  export default content
}

declare module 'varint' {
  const content: any

  export default content
}

declare module 'buffer-builder' {
  const content: any

  export default content
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXTAUTH_URL?: string
      VERCEL?: string

      AI_API_KEY: string
      AUTH_CLIENT_ID: string
      GITHUB_CLIENT_ID: string
      GITHUB_CLIENT_SECRET: string

      KV_URL?: string
      KV_REST_API_URL: string
      KV_REST_API_TOKEN: string
      KV_REST_API_READ_ONLY_TOKEN?: string

      NEXT_PUBLIC_SEGMENT_WRITE_KEY: string
      NEXT_PUBLIC_BASTPATH: string
      NEXT_PUBLIC_ORIGIN: string
    }
  }
}
