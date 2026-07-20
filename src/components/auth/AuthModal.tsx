import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Loader2, Lock, Mail, Phone, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { useToast } from '@/hooks/use-toast'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultRole?: 'customer' | 'vendor'
}

// Stabilized Inner component to prevent re-renders
const AuthModalInner = React.memo<{
  activeTab: 'signin' | 'signup' | 'forgot-password'
  formData: any
  loading: boolean
  onTabChange: (tab: 'signin' | 'signup' | 'forgot-password') => void
  onInputChange: (field: string, value: string) => void
  onSignIn: (e: React.FormEvent) => void
  onSignUp: (e: React.FormEvent) => void
  onForgotPassword: (e: React.FormEvent) => void
  isMobile: boolean
  emailInputRef: React.RefObject<HTMLInputElement>
  passwordInputRef: React.RefObject<HTMLInputElement>
}>(
  ({
    activeTab,
    formData,
    loading,
    onTabChange,
    onInputChange,
    onSignIn,
    onSignUp,
    onForgotPassword,
    isMobile,
    emailInputRef,
    passwordInputRef
  }) => (
    <>
      <DialogHeader>
        <DialogTitle className="text-center text-2xl font-bold text-party-charcoal">
          {activeTab === 'signin'
            ? 'Welcome Back! 🎉'
            : activeTab === 'signup'
              ? 'Join PartyGo! 🎈'
              : 'Reset Password 🔑'}
        </DialogTitle>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={onTabChange}>
        {activeTab !== 'forgot-password' && (
          <TabsList className="glass-card grid w-full grid-cols-2">
            <TabsTrigger
              value="signin"
              className="data-[state=active]:bg-pastel-pink/20"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="data-[state=active]:bg-pastel-blue/20"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="signin" className="space-y-4">
          <form onSubmit={onSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="signin-email"
                className="font-medium text-party-charcoal"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 size-4 text-party-gray" />
                <Input
                  ref={emailInputRef}
                  id="signin-email"
                  name="signin-email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => onInputChange('email', e.target.value)}
                  className="glass-input pl-10"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode="email"
                  enterKeyHint="next"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="signin-password"
                className="font-medium text-party-charcoal"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 size-4 text-party-gray" />
                <Input
                  ref={passwordInputRef}
                  id="signin-password"
                  name="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => onInputChange('password', e.target.value)}
                  className="glass-input pl-10"
                  autoComplete="current-password"
                  enterKeyHint="send"
                  required
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => onTabChange('forgot-password')}
                className="text-party-pink text-sm hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4">
          <form onSubmit={onSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="signup-name"
                className="font-medium text-party-charcoal"
              >
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 size-4 text-party-gray" />
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={(e) => onInputChange('fullName', e.target.value)}
                  className="glass-input pl-10"
                  autoComplete="name"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="signup-email"
                className="font-medium text-party-charcoal"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 size-4 text-party-gray" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => onInputChange('email', e.target.value)}
                  className="glass-input pl-10"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode="email"
                  enterKeyHint="next"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="signup-password"
                className="font-medium text-party-charcoal"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 size-4 text-party-gray" />
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => onInputChange('password', e.target.value)}
                  className="glass-input pl-10"
                  autoComplete="new-password"
                  enterKeyHint="next"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="signup-role"
                className="font-medium text-party-charcoal"
              >
                Account Type
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 z-10 size-4 text-party-gray" />
                <Select
                  value={formData.role}
                  onValueChange={(value: 'customer' | 'vendor') =>
                    onInputChange('role', value)
                  }
                >
                  <SelectTrigger className="glass-input pl-10">
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/20 backdrop-blur-xl">
                    <SelectItem value="customer">
                      Party Host (Customer)
                    </SelectItem>
                    <SelectItem value="vendor">
                      Party Vendor (Business)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.role === 'vendor' && (
              <div className="space-y-2">
                <Label
                  htmlFor="signup-phone"
                  className="font-medium text-party-charcoal"
                >
                  Phone Number{' '}
                  <span className="text-party-gray">
                    (for business contact)
                  </span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 size-4 text-party-gray" />
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => onInputChange('phone', e.target.value)}
                    className="glass-input pl-10"
                    autoComplete="tel"
                    inputMode="tel"
                    enterKeyHint="next"
                  />
                </div>
              </div>
            )}

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
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="forgot-password" className="space-y-4">
          <form onSubmit={onForgotPassword} className="space-y-4">
            <div className="mb-4 text-center text-sm text-party-gray">
              Enter your email address and we'll send you a link to reset your
              password.
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="forgot-email"
                className="font-medium text-party-charcoal"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 size-4 text-party-gray" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => onInputChange('email', e.target.value)}
                  className="glass-input pl-10"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode="email"
                  enterKeyHint="send"
                  required
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
                  Sending reset link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => onTabChange('signin')}
                className="text-party-pink text-sm hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-party-gray">
        By continuing, you agree to our{' '}
        <Link to="/terms" className="underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </div>
    </>
  )
)

AuthModalInner.displayName = 'AuthModalInner'

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onOpenChange,
  defaultRole
}) => {
  const [activeTab, setActiveTab] = useState<
    'signin' | 'signup' | 'forgot-password'
  >(defaultRole ? 'signup' : 'signin')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: (defaultRole || 'customer') as 'customer' | 'vendor',
    phone: ''
  })

  // Form refs as backup for state synchronization issues
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const fullNameInputRef = useRef<HTMLInputElement>(null)

  const { signIn, signUp, resetPassword } = useAuth()
  const { toast } = useToast()
  const isMobile = useIsMobile()

  // Stabilized callbacks to prevent re-renders
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleTabChange = useCallback(
    (tab: 'signin' | 'signup' | 'forgot-password') => {
      setActiveTab(tab)
    },
    []
  )

  const handleSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)

      // Use multiple fallback methods to get form values to handle React state synchronization issues
      let finalEmail = formData.email?.trim()
      let finalPassword = formData.password?.trim()

      // Fallback 1: Use refs if state is empty but refs have values
      if (!finalEmail && emailInputRef.current?.value) {
        finalEmail = emailInputRef.current.value.trim()
      }
      if (!finalPassword && passwordInputRef.current?.value) {
        finalPassword = passwordInputRef.current.value.trim()
      }

      // Fallback 2: Use form element access if both state and refs fail
      if (!finalEmail || !finalPassword) {
        const form = e.target as HTMLFormElement
        const emailInput = form?.elements.namedItem(
          'signin-email'
        ) as HTMLInputElement
        const passwordInput = form?.elements.namedItem(
          'signin-password'
        ) as HTMLInputElement

        if (!finalEmail && emailInput?.value) {
          finalEmail = emailInput.value.trim()
        }
        if (!finalPassword && passwordInput?.value) {
          finalPassword = passwordInput.value.trim()
        }
      }

      if (!finalEmail || !finalPassword) {
        toast({
          title: 'Sign in failed',
          description: 'Please enter both email and password.',
          variant: 'destructive'
        })
        setLoading(false)
        return
      }

      try {
        const { error } = await signIn(finalEmail, finalPassword)

        if (error) {
          toast({
            title: 'Sign in failed',
            description:
              error.message || 'Please check your credentials and try again.',
            variant: 'destructive'
          })
        } else {
          toast({
            title: 'Welcome back! 🎉',
            description: "You've successfully signed in to PartyGo."
          })
          onOpenChange(false)
          setFormData({
            email: '',
            password: '',
            fullName: '',
            role: 'customer',
            phone: ''
          })
        }
      } catch (error) {
        toast({
          title: 'Sign in failed',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    },
    [signIn, toast, onOpenChange]
  )

  const handleSignUp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)

      try {
        const { error } = await signUp(
          formData.email,
          formData.password,
          formData.fullName,
          formData.role,
          formData.phone
        )

        if (error) {
          toast({
            title: 'Sign up failed',
            description:
              error.message || 'Please try again with different credentials.',
            variant: 'destructive'
          })
        } else {
          toast({
            title: 'Account created! 🎉',
            description: 'Please check your email to verify your account.'
          })
          onOpenChange(false)
          setFormData({
            email: '',
            password: '',
            fullName: '',
            role: 'customer',
            phone: ''
          })
        }
      } catch (error) {
        toast({
          title: 'Sign up failed',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    },
    [
      signUp,
      toast,
      onOpenChange,
      formData.email,
      formData.password,
      formData.fullName,
      formData.role
    ]
  )

  const handleForgotPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)

      try {
        const { error } = await resetPassword(formData.email)

        if (error) {
          toast({
            title: 'Failed to send reset email',
            description:
              error.message || 'Please check your email address and try again.',
            variant: 'destructive'
          })
        } else {
          toast({
            title: 'Reset link sent! 📧',
            description: 'Check your email for a password reset link.'
          })
          setActiveTab('signin')
          setFormData({
            email: '',
            password: '',
            fullName: '',
            role: 'customer',
            phone: ''
          })
        }
      } catch (error) {
        toast({
          title: 'Failed to send reset email',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    },
    [resetPassword, formData.email, toast]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-h-[85vh] overflow-y-auto rounded-xl border-white/20 backdrop-blur-xl sm:max-w-md">
        <AuthModalInner
          activeTab={activeTab}
          formData={formData}
          loading={loading}
          onTabChange={handleTabChange}
          onInputChange={handleInputChange}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onForgotPassword={handleForgotPassword}
          isMobile={isMobile}
          emailInputRef={emailInputRef}
          passwordInputRef={passwordInputRef}
        />
      </DialogContent>
    </Dialog>
  )
}
