import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

// Helper function to parse URL fragments
const parseUrlFragment = (fragment: string): Record<string, string> => {
  const params: Record<string, string> = {}
  const cleanFragment = fragment.startsWith('#') ? fragment.slice(1) : fragment

  cleanFragment.split('&').forEach((param) => {
    const [key, value] = param.split('=')
    if (key && value) {
      params[key] = decodeURIComponent(value)
    }
  })

  return params
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()
  const { toast } = useToast()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [isValidSession, setIsValidSession] = useState(false)

  useEffect(() => {
    // Check if we have the required parameters and verify the session
    const verifyResetSession = async () => {
      try {
        // Parse tokens from URL fragment (after #)
        const fragment = window.location.hash
        console.log('URL fragment:', fragment)

        if (!fragment) {
          throw new Error('No reset tokens found in URL')
        }

        const params = parseUrlFragment(fragment)
        console.log('Parsed parameters:', params)

        const accessToken = params.access_token
        const refreshToken = params.refresh_token
        const { type } = params

        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('Setting session with tokens...')
          // Set the session with the tokens from the URL
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error('Session error:', error)
            throw error
          }

          console.log('Session set successfully')
          setIsValidSession(true)
        } else {
          console.error('Missing or invalid parameters:', {
            type,
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken
          })
          throw new Error('Invalid reset link parameters')
        }
      } catch (error) {
        console.error('Reset verification error:', error)
        toast({
          title: 'Invalid reset link',
          description: 'This password reset link is invalid or has expired.',
          variant: 'destructive'
        })
        navigate('/')
      } finally {
        setVerifying(false)
      }
    }

    verifyResetSession()
  }, [navigate, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: 'Please make sure both password fields match.',
        variant: 'destructive'
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await updatePassword(password)

      if (error) {
        toast({
          title: 'Failed to update password',
          description: error.message || 'Please try again.',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Password updated! 🎉',
          description: 'Your password has been successfully updated.'
        })
        navigate('/')
      }
    } catch (error) {
      toast({
        title: 'Failed to update password',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pastel-pink to-pastel-blue p-4">
        <Card className="glass-card w-full max-w-md border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Verifying reset link...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pastel-pink to-pastel-blue p-4">
        <Card className="glass-card w-full max-w-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-party-charcoal">
              Invalid Reset Link
            </CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button variant="gradient" className="w-full">
                <ArrowLeft className="mr-2 size-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pastel-pink to-pastel-blue p-4">
      <Card className="glass-card w-full max-w-md border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-party-charcoal">
            Reset Your Password 🔑
          </CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="font-medium text-party-charcoal"
              >
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 size-4 text-party-gray" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-10"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirm-password"
                className="font-medium text-party-charcoal"
              >
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 size-4 text-party-gray" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input pl-10"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>

            <div className="text-center">
              <Link to="/" className="text-party-pink text-sm hover:underline">
                Back to Home
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
