- metadata
  - metadataBase
  - title, default, template
  - description,
  - icons, icon, shortcut, apple
- viewport
  - themeColor
- RootLayout
  - html, body

## lib

- next
- next-themes
  - useTheme
  - ThemeProvider
- next-auth
  - AuthError
  - Credentials
  - authConfig
    - secret
    - pages, signIn, newUser
    - callbacks, authorized, jwt, session
    - providers
- next/cache
  - revalidatePath
- next/navigation

  - notFound, redirect

- @vercel/kv
  - string, get, set, getset, mset, mst, del, incr, incrby, decr, decrby, append, strlen
  - hash, hset, hsetnx, hget, hgetall, hdel, hincrby, hexists, hkeys, hvals, hlen
  - list, lpush, rpush, lrange, lpop, rpop, llen, lrem, lindex, lset, ltrim, linsert, rpoplpush
  - set, sadd, srem, smembers, sismember, sdiff, sinter, sunion, scard, spop
  - sorted set, zadd, zscore, zrem, zrange, zrevrange, zrank, zrevrank, zrangebyscore, zincrby, zcard, zcount,
- ai/rsc
  - createAI
  - createStreamableUI
  - getMutableAIState
  - getAIState
  - streamUI
  - createStreamableValue

## vendors

- geist
- sonner
- zod
- @ai-sdk/openai
- @vercel/og
