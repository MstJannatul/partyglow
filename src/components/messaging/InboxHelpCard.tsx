import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface InboxHelpCardProps {
  storageKey?: string
  className?: string
}

const DEFAULT_STORAGE_KEY = 'inbox_help_dismissed'

export function InboxHelpCard({
  storageKey = DEFAULT_STORAGE_KEY,
  className
}: InboxHelpCardProps) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const val = window.localStorage.getItem(storageKey)
        if (val === '1' || val === 'true') {
          // TODO: will use better approach later other than setTimeout
          setTimeout(() => {
            setDismissed(true)
          }, 0)
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [storageKey])

  const handleDismiss = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, '1')
      }
    } catch {
      // ignore storage errors
    }
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">What to do next</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <ul className="list-disc space-y-1 pl-5">
          <li>Select a conversation to read and reply.</li>
          <li>Start a new inquiry from a listing page.</li>
          <li>Archive finished chats to stay organized.</li>
        </ul>
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="secondary" onClick={handleDismiss}>
            Got it
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
