import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      location.pathname
    )
  }, [location.pathname])

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-gray-100"
    >
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Page not found</h1>
        <p className="mb-4 text-xl text-gray-600">
          Let's get you back on track.
        </p>
        <div className="space-x-4">
          <Link
            to="/browse"
            className="text-blue-500 underline hover:text-blue-700"
          >
            Browse vendors
          </Link>
          <Link to="/" className="text-blue-500 underline hover:text-blue-700">
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}

export default NotFound
