import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Clock, Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/services/clientAnalytics'

interface SearchBarProps {
  onSearch: (search: string) => void
  placeholder?: string
  className?: string
}

export const SearchBar = memo(
  ({
    onSearch,
    placeholder = 'Search vendors, services, or packages',
    className
  }: SearchBarProps) => {
    const [searchValue, setSearchValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)
    const isMobile = useIsMobile()

    // Load recent searches from localStorage
    useEffect(() => {
      const saved = localStorage.getItem('partygo-recent-searches')
      if (saved) {
        try {
          // TODO: will use better approach later other than setTimeout
          setTimeout(() => {
            setRecentSearches(JSON.parse(saved))
          }, 0)
        } catch {
          // Ignore parse errors
        }
      }
    }, [])

    // Handle search submission
    const handleSearch = useCallback(
      (value: string) => {
        if (value.trim()) {
          onSearch(value.trim())

          // Track search event
          trackEvent('search_performed', {
            searchQuery: value.trim(),
            queryLength: value.trim().length
          })

          // Add to recent searches
          const newRecentSearches = [
            value.trim(),
            ...recentSearches.filter((s) => s !== value.trim())
          ].slice(0, 5)
          setRecentSearches(newRecentSearches)
          localStorage.setItem(
            'partygo-recent-searches',
            JSON.stringify(newRecentSearches)
          )

          setShowSuggestions(false)
          if (!isMobile) {
            inputRef.current?.blur()
          }
        }
      },
      [onSearch, recentSearches, isMobile]
    )

    // Handle input change with proper debouncing
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target
        setSearchValue(value)

        // Clear previous timeout
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }

        // Set new timeout with mobile-specific timing
        const debounceTime = isMobile ? 500 : 300
        debounceRef.current = setTimeout(() => {
          if (value.trim()) {
            onSearch(value.trim())
          } else {
            onSearch('')
          }
        }, debounceTime)
      },
      [onSearch, isMobile]
    )

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch(searchValue)
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
        inputRef.current?.blur()
      }
    }

    // Clear search
    const clearSearch = () => {
      setSearchValue('')
      onSearch('')
      inputRef.current?.focus()
    }

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: string) => {
      setSearchValue(suggestion)
      handleSearch(suggestion)
    }

    // Remove from recent searches
    const removeRecentSearch = (searchToRemove: string) => {
      const newRecentSearches = recentSearches.filter(
        (s) => s !== searchToRemove
      )
      setRecentSearches(newRecentSearches)
      localStorage.setItem(
        'partygo-recent-searches',
        JSON.stringify(newRecentSearches)
      )
    }

    // Popular searches
    const popularSearches = [
      'bounce house',
      'wedding catering',
      'DJ services',
      'photo booth',
      'tables and chairs',
      'party decorations'
    ]

    // Click outside handler and cleanup
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setShowSuggestions(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        // Clear any pending debounce timeout
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }
      }
    }, [])

    return (
      <div
        ref={containerRef}
        className={cn('relative w-full max-w-2xl mx-auto', className)}
      >
        {/* Search Input */}
        <div
          className={cn(
            'relative flex items-center bg-background border rounded-xl transition-all duration-200',
            isFocused
              ? 'ring-2 ring-primary/20 border-primary/30 shadow-lg'
              : 'border-border shadow-sm'
          )}
        >
          <Search className="ml-4 size-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onFocus={() => {
              setIsFocused(true)
              setShowSuggestions(true)
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="mobile-input-stable h-12 border-0 bg-transparent pl-2 pr-12 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
          />

          {/* Clear Button */}
          {searchValue && (
            <button
              onClick={clearSearch}
              className="absolute right-4 rounded-full p-1 transition-colors hover:bg-muted"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && (isFocused || searchValue) && (
          <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-background shadow-xl">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="border-b border-border p-4">
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  Recent Searches
                </h4>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="group flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-muted"
                      onClick={() => handleSuggestionClick(search)}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-muted-foreground" />
                        <span className="text-sm">{search}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeRecentSearch(search)
                        }}
                        className="rounded p-1 opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
                      >
                        <X className="size-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            <div className="p-4">
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                Popular Searches
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="rounded-lg p-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

SearchBar.displayName = 'SearchBar'
