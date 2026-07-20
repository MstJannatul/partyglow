import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const FocusMainOnRouteChange: React.FC = () => {
  const location = useLocation()

  useEffect(() => {
    const el = document.getElementById('main-content') as HTMLElement | null
    if (el) {
      const prevTabIndex = el.getAttribute('tabindex')
      if (!prevTabIndex) el.setAttribute('tabindex', '-1')
      el.focus()
      if (!prevTabIndex) el.removeAttribute('tabindex')
    }
  }, [location.pathname])

  return null
}

export default FocusMainOnRouteChange
