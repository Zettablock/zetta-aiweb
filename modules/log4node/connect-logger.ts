/* eslint no-underscore-dangle: ["error", { "allow": ["__statusCode", "_remoteAddress", "__headers", "_logging"] }] */
import { IncomingMessage, ServerResponse } from 'http'
import { Logger, Level, LevelEnum } from '@/modules/logger'

const DEFAULT_FORMAT =
  ':remote-addr - -' +
  ' ":method :url HTTP/:http-version"' +
  ' :status :content-length ":referrer"' +
  ' ":user-agent"'

type Token = {
  token: string | RegExp
  replacement?: string | ((...args: string[]) => string | undefined)
}
type LineFormat = (
  req: IncomingMessage,
  res: ServerResponse,
  format: (str: string, tokens: Array<Token>) => string
) => any

/**
 * Return request url path,
 * adding this function prevents the Cyclomatic Complexity,
 * for the assemble_tokens function at low, to pass the tests.
 *
 * @param  {IncomingMessage} req
 * @return {string}
 * @api private
 */
function getUrl(req: IncomingMessage) {
  return (req as any).originalUrl || req.url
}

/**
 * Adds custom {token, replacement} objects to defaults,
 * overwriting the defaults if any tokens clash
 *
 * @param  {IncomingMessage} req
 * @param  {ServerResponse} res
 * @param  {Array} customTokens
 *    [{ token: string-or-regexp, replacement: string-or-replace-function }]
 * @return {Array}
 */
function assembleTokens(
  req: IncomingMessage,
  res: ServerResponse,
  customTokens: Token[]
) {
  const ireq = req as any
  const ires = res as any
  const arrayUniqueTokens = (array: Token[]) => {
    const a = array.concat()
    for (let i = 0; i < a.length; ++i) {
      for (let j = i + 1; j < a.length; ++j) {
        // not === because token can be regexp object
        // eslint-disable-next-line eqeqeq
        if (a[i].token == a[j].token) {
          a.splice(j--, 1) // eslint-disable-line no-plusplus
        }
      }
    }
    return a
  }

  const defaultTokens = [] as Array<Token>

  defaultTokens.push({ token: ':url', replacement: getUrl(req) })
  defaultTokens.push({ token: ':protocol', replacement: ireq.protocol })
  defaultTokens.push({ token: ':hostname', replacement: ireq.hostname })
  defaultTokens.push({ token: ':method', replacement: req.method })
  defaultTokens.push({
    token: ':status',
    replacement: ires.__statusCode || res.statusCode
  })
  defaultTokens.push({
    token: ':response-time',
    replacement: ires.responseTime
  })
  defaultTokens.push({ token: ':date', replacement: new Date().toUTCString() })
  defaultTokens.push({
    token: ':referrer',
    replacement: req.headers.referer || (req.headers.referrer as string) || ''
  })
  defaultTokens.push({
    token: ':http-version',
    replacement: `${req.httpVersionMajor}.${req.httpVersionMinor}`
  })
  defaultTokens.push({
    token: ':remote-addr',
    replacement:
      req.headers['x-forwarded-for'] ||
      ireq.ip ||
      ireq._remoteAddress ||
      (req.socket &&
        (req.socket.remoteAddress ||
          ((req.socket as any).socket &&
            (req.socket as any).socket.remoteAddress)))
  })
  defaultTokens.push({
    token: ':user-agent',
    replacement: req.headers['user-agent']
  })
  defaultTokens.push({
    token: ':content-length',
    replacement:
      res.getHeader('content-length') ||
      (ires.__headers && ires.__headers['Content-Length']) ||
      '-'
  })
  defaultTokens.push({
    token: /:req\[([^\]]+)]/g,
    replacement(_, field) {
      return req.headers[field.toLowerCase()] as string
    }
  })
  defaultTokens.push({
    token: /:res\[([^\]]+)]/g,
    replacement(_, field) {
      return (
        res.getHeader(field.toLowerCase()) ||
        (ires.__headers && ires.__headers[field])
      )
    }
  })

  return arrayUniqueTokens(customTokens.concat(defaultTokens))
}

/**
 * Return formatted log line.
 *
 * @param  {string} str
 * @param {Array} tokens
 * @return {string}
 * @api private
 */
function format(str: string, tokens: Token[]) {
  for (let i = 0; i < tokens.length; i++) {
    str = str.replace(tokens[i].token, tokens[i].replacement as any)
  }
  return str
}

/**
 * Return RegExp Object about nolog
 *
 * @param  {(string|Array)} nolog
 * @return {RegExp}
 * @api private
 *
 * syntax
 *  1. String
 *   1.1 "\\.gif"
 *         NOT LOGGING http://example.com/hoge.gif and http://example.com/hoge.gif?fuga
 *         LOGGING http://example.com/hoge.agif
 *   1.2 in "\\.gif|\\.jpg$"
 *         NOT LOGGING http://example.com/hoge.gif and
 *           http://example.com/hoge.gif?fuga and http://example.com/hoge.jpg?fuga
 *         LOGGING http://example.com/hoge.agif,
 *           http://example.com/hoge.ajpg and http://example.com/hoge.jpg?hoge
 *   1.3 in "\\.(gif|jpe?g|png)$"
 *         NOT LOGGING http://example.com/hoge.gif and http://example.com/hoge.jpeg
 *         LOGGING http://example.com/hoge.gif?uid=2 and http://example.com/hoge.jpg?pid=3
 *  2. RegExp
 *   2.1 in /\.(gif|jpe?g|png)$/
 *         SAME AS 1.3
 *  3. Array
 *   3.1 ["\\.jpg$", "\\.png", "\\.gif"]
 *         SAME AS "\\.jpg|\\.png|\\.gif"
 */
function createNoLogCondition(nolog?: RegExp | string) {
  let regexp = null as RegExp | string | null

  if (nolog instanceof RegExp) {
    regexp = nolog
  }

  if (typeof nolog === 'string') {
    regexp = new RegExp(nolog)
  }

  if (Array.isArray(nolog)) {
    // convert to strings
    const regexpsAsStrings = nolog.map(reg => (reg.source ? reg.source : reg))
    regexp = new RegExp(regexpsAsStrings.join('|'))
  }

  return regexp as RegExp
}

/**
 * Allows users to define rules around status codes to assign them to a specific
 * logging level.
 * There are two types of rules:
 *   - RANGE: matches a code within a certain range
 *     E.g. { 'from': 200, 'to': 299, 'level': 'info' }
 *   - CONTAINS: matches a code to a set of expected codes
 *     E.g. { 'codes': [200, 203], 'level': 'debug' }
 * Note*: Rules are respected only in order of prescendence.
 *
 * @param {Number} statusCode
 * @param {Level} currentLevel
 * @param {Object} ruleSet
 * @return {Level}
 * @api private
 */
function matchRules(statusCode: number, currentLevel: Level, ruleSet?: any[]) {
  let level = currentLevel

  if (ruleSet) {
    const matchedRule = ruleSet.find(rule => {
      let ruleMatched = false
      if (rule.from && rule.to) {
        ruleMatched = statusCode >= rule.from && statusCode <= rule.to
      } else {
        ruleMatched = rule.codes.indexOf(statusCode) !== -1
      }
      return ruleMatched
    })
    if (matchedRule) {
      level = Level.getLevel(matchedRule.level, level)
    }
  }
  return level
}

/**
 * Log requests with the given `options` or a `format` string.
 *
 * Options:
 *
 *   - `format`        Format string, see below for tokens
 *   - `level`         A Logger levels instance. Supports also 'auto'
 *   - `nolog`         A string or RegExp to exclude target logs or function(req, res): boolean
 *   - `statusRules`   A array of rules for setting specific logging levels base on status codes
 *   - `context`       Whether to add a response of express to the context
 *
 * Tokens:
 *
 *   - `:req[header]` ex: `:req[Accept]`
 *   - `:res[header]` ex: `:res[Content-Length]`
 *   - `:http-version`
 *   - `:response-time`
 *   - `:remote-addr`
 *   - `:date`
 *   - `:method`
 *   - `:url`
 *   - `:referrer`
 *   - `:user-agent`
 *   - `:status`
 *
 * @return {Function}
 * @param logger
 * @param options
 * @api public
 */
export function connectLogger(
  logger: Logger,
  options:
    | {
        format?: LineFormat | string
        nolog?:
          | RegExp
          | string
          | ((req: IncomingMessage, res: ServerResponse) => boolean)
        level?: LevelEnum | Level
        statusRules?: any[]
        tokens?: Token[]
        context?: boolean
      }
    | LineFormat
    | string
) {
  if (typeof options === 'string' || typeof options === 'function') {
    options = { format: options }
  } else {
    options = options || {}
  }

  const thisLogger = logger
  let level = Level.getLevel(options.level, Level.INFO)
  const fmt = options.format || DEFAULT_FORMAT

  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const ireq = req as any
    const ires = res as any
    ireq.logger = logger
    // mount safety
    if (typeof ireq._logging !== 'undefined') return next()

    // nologs
    if (typeof options.nolog !== 'function') {
      const nolog = createNoLogCondition(options.nolog)
      if (nolog && nolog.test(ireq.originalUrl)) return next()
    }

    if (thisLogger.isLevelEnabled(level) || options.level === LevelEnum.ALL) {
      const start = Date.now()
      const writeHead = res.writeHead

      // flag as logging
      ireq._logging = true

      // proxy for statusCode.
      res.writeHead = (code: number, headers: any) => {
        res.writeHead = writeHead
        res.writeHead(code, headers)

        ires.__statusCode = code
        ires.__headers = headers || {}
        return res
      }

      // hook on end request to emit the log entry of the HTTP request.
      let finished = false
      const handler = () => {
        if (finished) {
          return
        }
        finished = true

        // nologs
        if (typeof options.nolog === 'function') {
          if (options.nolog(req, res) === true) {
            ireq._logging = false
            return
          }
        }
        ires.responseTime = Date.now() - start
        // status code response level handling
        if (res.statusCode && options.level === LevelEnum.ALL) {
          level = Level.INFO
          if (res.statusCode >= 300) level = Level.WARN
          if (res.statusCode >= 400) level = Level.ERROR
        }
        level = matchRules(res.statusCode, level, options.statusRules)

        const combinedTokens = assembleTokens(req, res, options.tokens || [])

        if (options.context) thisLogger.addContext('res', res)
        if (typeof fmt === 'function') {
          const line = fmt(req, res, str => format(str, combinedTokens))
          if (line) thisLogger.log(level, line)
        } else {
          thisLogger.log(level, format(fmt, combinedTokens))
        }
        if (options.context) thisLogger.removeContext('res')
      }
      res.on('end', handler)
      res.on('finish', handler)
      res.on('error', handler)
      res.on('close', handler)
    }

    // ensure next gets always called
    return next()
  }
}
