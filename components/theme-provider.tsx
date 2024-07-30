'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { ConfigProvider } from 'antd'
import { useServerInsertedHTML } from 'next/navigation'
import { StyleProvider, createCache, extractStyle } from '@ant-design/cssinjs'
import type Entity from '@ant-design/cssinjs/es/Cache'

import type { ThemeConfig } from 'antd'

const theme: ThemeConfig = {
  token: {
    fontSize: 14
  }
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const cache = React.useMemo<Entity>(() => createCache(), [])
  useServerInsertedHTML(() => (
    <style
      id="antd"
      dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }}
    />
  ))

  return (
    <NextThemesProvider {...props}>
      <StyleProvider cache={cache}>
        <ConfigProvider theme={theme}>{children}</ConfigProvider>
      </StyleProvider>
    </NextThemesProvider>
  )
}
