import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Building,
  FileText,
  MapPin,
  Phone,
  Save,
  Upload,
  User
} from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import Header from '@/components/layout/Header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { SEO } from '@/lib/seo'
import { zodResolver } from '@hookform/resolvers/zod'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  business_name: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  vendor_type: z.string().optional(),
  avatar_url: z.string().optional()
})

type ProfileFormData = z.infer<typeof profileSchema>

const Settings = () => {
  const { user, profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      business_name: profile?.business_name || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      phone: profile?.phone || '',
      vendor_type: profile?.vendor_type || '',
      avatar_url: profile?.avatar_url || ''
    }
  })

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await updateProfile(data)

      if (error) {
        toast.error('Failed to update profile: ' + error.message)
      } else {
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl }
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      form.setValue('avatar_url', publicUrl)
      toast.success('Avatar uploaded successfully!')
    } catch (error) {
      toast.error('Failed to upload avatar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO
        title="Settings - Party Goods"
        description="Manage your account settings and profile information"
      />

      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your profile information and account preferences
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Complete your profile to help customers find and trust your
                services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-4">
                    <Avatar className="size-20">
                      <AvatarImage src={form.watch('avatar_url')} />
                      <AvatarFallback>
                        {form.watch('full_name')?.charAt(0)?.toUpperCase() ||
                          user?.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          asChild
                        >
                          <span>
                            <Upload className="size-4" />
                            Change Avatar
                          </span>
                        </Button>
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={uploadAvatar}
                        className="hidden"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        JPG, PNG or GIF. Max 5MB.
                      </p>
                    </div>
                  </div>

                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="size-4" />
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Business Name */}
                  <FormField
                    control={form.control}
                    name="business_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Building className="size-4" />
                          Business Name (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your business or company name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="size-4" />
                          Location (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="City, State or Area you serve"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="size-4" />
                          Phone Number (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Your phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Vendor Type (if vendor) */}
                  {profile?.role === 'vendor' && (
                    <FormField
                      control={form.control}
                      name="vendor_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vendor Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your vendor type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="dj">DJ</SelectItem>
                              <SelectItem value="catering">Catering</SelectItem>
                              <SelectItem value="photographer">
                                Photographer
                              </SelectItem>
                              <SelectItem value="decorator">
                                Decorator
                              </SelectItem>
                              <SelectItem value="equipment_rental">
                                Equipment Rental
                              </SelectItem>
                              <SelectItem value="entertainment">
                                Entertainment
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Bio */}
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="size-4" />
                          Bio (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about yourself or your business..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <Save className="size-4" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default Settings
