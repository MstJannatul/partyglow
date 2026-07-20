import React, { ReactNode } from 'react'

import Header from '@/components/layout/Header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDashboard } from '@/contexts/DashboardContext'

interface DashboardLayoutProps {
  children: ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
  tabs: Array<{
    id: string
    label: string
    icon?: React.ComponentType<{ className?: string }>
  }>
}

export function DashboardLayout({
  children,
  activeTab,
  onTabChange,
  tabs
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="mb-16 grid w-full grid-cols-2 md:mb-20 lg:grid-cols-6">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
              >
                {tab.icon && <tab.icon className="size-4" />}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {children}
        </Tabs>
      </main>
    </div>
  )
}
