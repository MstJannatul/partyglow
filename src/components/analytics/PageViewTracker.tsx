import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

import { trackEvent } from '@/services/clientAnalytics'

export function PageViewTracker() {
  const location = useLocation()
  const prevPathRef = useRef<string | null>(null)

  useEffect(() => {
    const path = location.pathname + (location.search || '')
    const referrer = prevPathRef.current || document.referrer || ''
    prevPathRef.current = path

    trackEvent('page_view', {
      page: path,
      referrer,
      userAgent: navigator.userAgent
    })
  }, [location.pathname, location.search])

  return null
}
