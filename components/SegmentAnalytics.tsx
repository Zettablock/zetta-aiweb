'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { analytics } from '@/lib/segment'

export function SegmentAnalytics(props: any) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    analytics.page()
  }, [pathname, searchParams])

  return <div>1</div>
}
