import createDebug from 'debug'

const debug = createDebug('logger:configuration')

export enum LevelEnum {
  ALL = 'all',
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
  MARK = 'mark',
  OFF = 'off'
}

export interface ConfigListener {
  (configure: Configuration): void
}

export interface Category {
  inherit?: boolean
  appenders: string[]
  level?: LevelEnum
  enableCallStack?: boolean
  parent?: Category
}
export type AppenderFn = (logEvent: any) => void
export type AppenderModule = {
  configure: (
    config: Configuration,
    layouts: any,
    findAppender: (appender: string) => AppenderFn
  ) => AppenderFn
}
export interface Configuration {
  levels?: Record<string, { value: number; colour: string }>
  appender?: string
  layout?: { type: string }
  appenders?: Record<
    string,
    { type: string | AppenderModule; layout?: { type: string } }
  >
  categories: Record<string, Category>
  exclude?: string | string[]
  pm2?: boolean
  disableClustering?: boolean
  pm2InstanceVar?: string
}

const preProcessingListeners = [] as ConfigListener[]
const listeners = [] as ConfigListener[]

export const not = (thing: any) => !thing

export const anObject = (thing: any) =>
  thing && typeof thing === 'object' && !Array.isArray(thing)

export const validIdentifier = (thing: string) =>
  /^[A-Za-z][A-Za-z0-9_]*$/g.test(thing)

export const anInteger = (thing: any) =>
  thing && typeof thing === 'number' && Number.isInteger(thing)

export const addListener = (fn: ConfigListener) => {
  listeners.push(fn)
  debug(`Added listener, now ${listeners.length} listeners`)
}

export const addPreProcessingListener = (fn: ConfigListener) => {
  preProcessingListeners.push(fn)
  debug(
    `Added pre-processing listener, now ${preProcessingListeners.length} listeners`
  )
}

export const throwExceptionIf = (
  config: Configuration,
  checks: boolean | boolean[],
  message: string
) => {
  const tests = Array.isArray(checks) ? checks : [checks]
  tests.forEach(test => {
    if (test) {
      throw new Error(
        `Problem with logger configuration: (${JSON.stringify(config)}) - ${message}`
      )
    }
  })
}

export const configure = (candidate: Configuration) => {
  debug('New configuration to be validated: ', candidate)
  throwExceptionIf(candidate, not(anObject(candidate)), 'must be an object.')

  debug(`Calling pre-processing listeners (${preProcessingListeners.length})`)
  preProcessingListeners.forEach(listener => listener(candidate))
  debug('Configuration pre-processing finished.')

  debug(`Calling configuration listeners (${listeners.length})`)
  listeners.forEach(listener => listener(candidate))
  debug('Configuration finished.')
}
