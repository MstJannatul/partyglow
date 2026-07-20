import React, { createContext, ReactNode, useContext, useState } from 'react'

interface DashboardState {
  activeTab: string
  dateRange: string
  filters: Record<string, any>
  preferences: Record<string, any>
}

interface DashboardContextType {
  dashboardState: DashboardState
  setActiveTab: (tab: string) => void
  setDateRange: (range: string) => void
  setFilters: (filters: Record<string, any>) => void
  setPreferences: (preferences: Record<string, any>) => void
  updateDashboardState: (updates: Partial<DashboardState>) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
)

export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

interface DashboardProviderProps {
  children: ReactNode
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children
}) => {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    activeTab: 'overview',
    dateRange: 'last30days',
    filters: {},
    preferences: {}
  })

  const setActiveTab = (tab: string) => {
    setDashboardState((prev) => ({ ...prev, activeTab: tab }))
  }

  const setDateRange = (range: string) => {
    setDashboardState((prev) => ({ ...prev, dateRange: range }))
  }

  const setFilters = (filters: Record<string, any>) => {
    setDashboardState((prev) => ({ ...prev, filters }))
  }

  const setPreferences = (preferences: Record<string, any>) => {
    setDashboardState((prev) => ({ ...prev, preferences }))
  }

  const updateDashboardState = (updates: Partial<DashboardState>) => {
    setDashboardState((prev) => ({ ...prev, ...updates }))
  }

  const value: DashboardContextType = {
    dashboardState,
    setActiveTab,
    setDateRange,
    setFilters,
    setPreferences,
    updateDashboardState
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}
