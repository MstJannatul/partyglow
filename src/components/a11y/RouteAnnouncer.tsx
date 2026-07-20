import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export const RouteAnnouncer: React.FC = () => {
  const location = useLocation()
  const [message, setMessage] = useState('')

  useEffect(() => {
    const title = document.title || 'Page'
    // TODO: will use better approach later other than setTimeout
    setTimeout(() => {
      setMessage(`Navigated to ${title}`)
    }, 0)
  }, [location.pathname])

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}

export default RouteAnnouncer
