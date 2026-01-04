'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Briefcase,
  User,
  MessageSquare,
  GraduationCap,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Plus,
  Sun,
  Moon,
  BarChart3,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'
import type { Application } from '@/types/database'

// Theme Toggle Component
function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // This pattern is necessary to prevent hydration mismatch with next-themes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg flex items-center justify-center">
        <div className="w-5 h-5" />
      </div>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-content-secondary" />
      ) : (
        <Moon className="w-5 h-5 text-content-secondary" />
      )}
    </button>
  )
}

// Quick actions for search
const quickActions = [
  { label: 'Add new application', icon: Plus, route: '/tracker/add' },
  { label: 'View all applications', icon: Briefcase, route: '/tracker' },
  { label: 'View profile', icon: User, route: '/profile' },
  { label: 'Edit profile', icon: User, route: '/profile/edit' },
  { label: 'AI Assistant', icon: MessageSquare, route: '/assistant' },
  { label: 'Interview Coach', icon: GraduationCap, route: '/coach' },
  { label: 'Go to Dashboard', icon: Home, route: '/dashboard' },
  { label: 'Settings', icon: Settings, route: '/settings' },
]

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  activeIcon?: React.ReactNode
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <Home className="w-5 h-5" strokeWidth={1.5} />,
    activeIcon: <Home className="w-5 h-5" strokeWidth={2} />
  },
  {
    href: '/tracker',
    label: 'Applications',
    icon: <Briefcase className="w-5 h-5" strokeWidth={1.5} />,
    activeIcon: <Briefcase className="w-5 h-5" strokeWidth={2} />
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: <User className="w-5 h-5" strokeWidth={1.5} />,
    activeIcon: <User className="w-5 h-5" strokeWidth={2} />
  },
  {
    href: '/assistant',
    label: 'AI Assistant',
    icon: <MessageSquare className="w-5 h-5" strokeWidth={1.5} />,
    activeIcon: <MessageSquare className="w-5 h-5" strokeWidth={2} />
  },
  {
    href: '/coach',
    label: 'Interview Coach',
    icon: <GraduationCap className="w-5 h-5" strokeWidth={1.5} />,
    activeIcon: <GraduationCap className="w-5 h-5" strokeWidth={2} />
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    icon: <BarChart3 className="w-5 h-5" strokeWidth={1.5} />,
    activeIcon: <BarChart3 className="w-5 h-5" strokeWidth={2} />
  },
]

interface AppShellProps {
  children: React.ReactNode
  title?: string
  userName?: string | null
  actions?: React.ReactNode
}

export function AppShell({ children, title, userName, actions }: AppShellProps) {
  void actions // Intentionally unused - kept for API compatibility
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [profileName, setProfileName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Load sidebar state from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved === 'true') {
      setSidebarCollapsed(true)
    }
    setHasMounted(true)
  }, [])

  // Persist sidebar state to localStorage
  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed))
    }
  }, [sidebarCollapsed, hasMounted])

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      setUserEmail(user.email || null)

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setProfileName(profile.name)
      }
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.error(error.message)
      return
    }

    router.push('/')
    router.refresh()
  }

  const displayName = userName || profileName

  const getInitials = () => {
    if (!displayName) return 'U'
    const parts = displayName.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return displayName[0].toUpperCase()
  }

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <aside
      className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:flex-col bg-card border-r border-border transition-all duration-200 ${
        sidebarCollapsed ? 'lg:w-[74px]' : 'lg:w-64'
      }`}
    >
      <nav className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-lg bg-[#9FE870] flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-[#163300]">N</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-bold text-content-primary">NexCareer</span>
            )}
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            // Check if there's a more specific nav item that matches
            const hasMoreSpecificMatch = navItems.some(
              (other) => other.href !== item.href &&
                         other.href.startsWith(item.href + '/') &&
                         pathname.startsWith(other.href)
            )
            const isActive = hasMoreSpecificMatch
              ? false
              : pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  sidebarCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-[rgba(22,51,0,0.08)] dark:bg-[rgba(159,232,112,0.12)] text-accent-green'
                    : 'text-content-secondary hover:bg-muted hover:text-content-primary'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-2.5 bottom-2.5 w-[3px] bg-accent-green rounded-full" />
                )}
                {isActive ? (item.activeIcon || item.icon) : item.icon}
                {!sidebarCollapsed && item.label}
              </Link>
            )
          })}
        </div>

        {/* Divider */}
        <div className="px-3">
          <div className="border-t border-border" />
        </div>

        {/* Collapse Toggle */}
        <div className="py-2 px-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-content-tertiary hover:bg-muted hover:text-content-secondary transition-colors w-full ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                Collapse
              </>
            )}
          </button>
        </div>

        {/* Settings & Sign out */}
        <div className="px-2 pb-3 space-y-1">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              sidebarCollapsed ? 'justify-center' : ''
            } ${
              pathname === '/settings'
                ? 'bg-[rgba(22,51,0,0.08)] dark:bg-[rgba(159,232,112,0.12)] text-accent-green'
                : 'text-content-secondary hover:bg-muted hover:text-content-primary'
            }`}
            title={sidebarCollapsed ? 'Settings' : undefined}
          >
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && 'Settings'}
          </Link>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-content-secondary hover:bg-muted hover:text-destructive transition-colors w-full ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && 'Sign Out'}
          </button>
        </div>
      </nav>
    </aside>
  )

  // Desktop Top Bar
  const DesktopTopBar = () => {
    const [searchFocused, setSearchFocused] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Application[]>([])
    const [matchingActions, setMatchingActions] = useState<typeof quickActions>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)
    const userMenuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
          setSearchFocused(false)
        }
        if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
          setShowUserMenu(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSearch = async (query: string) => {
      setSearchQuery(query)
      if (!query.trim()) {
        setSearchResults([])
        setMatchingActions([])
        return
      }

      const normalizedQuery = query.toLowerCase().trim()

      // Search quick actions (instant, no async)
      const filteredActions = quickActions.filter((action) =>
        action.label.toLowerCase().includes(normalizedQuery)
      )
      setMatchingActions(filteredActions)

      // Search applications
      setIsSearching(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', user.id)
          .or(`company.ilike.%${query}%,position.ilike.%${query}%`)
          .limit(5)

        setSearchResults((data || []) as Application[])
      }
      setIsSearching(false)
    }

    return (
      <header className="hidden lg:flex items-center justify-between h-16 px-6 bg-card border-b border-border sticky top-0 z-40">
        {/* Page Title */}
        <h1 className="text-xl font-bold text-content-primary">{title}</h1>

        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div ref={searchRef} className="relative">
            <div
              className={`flex items-center h-10 rounded-xl bg-muted transition-all duration-200 ${
                searchFocused
                  ? 'w-[360px] ring-2 ring-forest-green'
                  : 'w-[200px]'
              }`}
            >
              <Search className="w-4 h-4 ml-3 text-content-tertiary" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="flex-1 h-full px-3 bg-transparent text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); setMatchingActions([]) }}
                  className="p-1 mr-2 text-content-tertiary hover:text-content-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchFocused && searchQuery && (
              <div className="absolute top-12 left-0 w-[360px] bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 max-h-[400px] overflow-y-auto">
                {isSearching && searchResults.length === 0 && matchingActions.length === 0 ? (
                  <div className="p-4 text-center text-content-secondary text-sm">
                    Searching...
                  </div>
                ) : searchResults.length > 0 || matchingActions.length > 0 ? (
                  <div>
                    {/* Applications Section */}
                    {searchResults.length > 0 && (
                      <>
                        <div className="px-4 py-2 text-[11px] font-semibold text-content-tertiary uppercase tracking-wider">
                          Applications
                        </div>
                        {searchResults.map((app) => (
                          <Link
                            key={app.id}
                            href={`/tracker/${app.id}`}
                            onClick={() => { setSearchFocused(false); setSearchQuery(''); setMatchingActions([]) }}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                          >
                            <Briefcase className="w-[18px] h-[18px] text-content-secondary" />
                            <div>
                              <p className="text-sm font-medium text-content-primary">{app.company}</p>
                              <p className="text-xs text-content-secondary">{app.position}</p>
                            </div>
                          </Link>
                        ))}
                      </>
                    )}

                    {/* Quick Actions Section */}
                    {matchingActions.length > 0 && (
                      <>
                        <div className="px-4 py-2 text-[11px] font-semibold text-content-tertiary uppercase tracking-wider">
                          Quick Actions
                        </div>
                        {matchingActions.map((action) => {
                          const Icon = action.icon
                          return (
                            <Link
                              key={action.route}
                              href={action.route}
                              onClick={() => { setSearchFocused(false); setSearchQuery(''); setMatchingActions([]) }}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                            >
                              <Icon className="w-[18px] h-[18px] text-content-secondary" />
                              <p className="text-sm font-medium text-content-primary">{action.label}</p>
                            </Link>
                          )
                        })}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-content-primary">No results for &quot;{searchQuery}&quot;</p>
                    <p className="text-xs text-content-secondary mt-1">Try searching for company names or positions</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notification Bell */}
          <NotificationDropdown />

          {/* User Avatar */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 rounded-full avatar-bg flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <span className="text-sm font-semibold avatar-text">{getInitials()}</span>
            </button>

            {showUserMenu && (
              <div className="absolute top-12 right-0 w-[220px] bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                {/* User Info */}
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium text-content-primary">{displayName || 'User'}</p>
                  <p className="text-xs text-content-secondary truncate">{userEmail}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-content-primary hover:bg-muted transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-content-primary hover:bg-muted transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-border py-1">
                  <button
                    onClick={() => { setShowUserMenu(false); handleLogout() }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-destructive hover:bg-muted transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    )
  }

  // Mobile Search Sheet
  const MobileSearchSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const [query, setQuery] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query)}`)
        onClose()
      }
    }

    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          {/* Handle bar */}
          <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

          {/* Search Input */}
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search applications, actions..."
                className="pl-10 pr-10 h-12"
                autoFocus
              />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Quick Actions */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-2">
              Quick Actions
            </p>
            <div className="space-y-1">
              <Link
                href="/tracker/add"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Plus className="w-5 h-5 text-content-secondary" />
                <span className="text-sm text-content-primary">Add Application</span>
              </Link>
              <Link
                href="/tracker"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Briefcase className="w-5 h-5 text-content-secondary" />
                <span className="text-sm text-content-primary">View Applications</span>
              </Link>
              <Link
                href="/assistant"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-content-secondary" />
                <span className="text-sm text-content-primary">AI Assistant</span>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Mobile Nav Content (for drawer)
  const MobileNavContent = () => (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#9FE870] flex items-center justify-center">
            <span className="text-lg font-bold text-[#163300]">N</span>
          </div>
          <span className="text-xl font-bold text-content-primary">NexCareer</span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          // Check if there's a more specific nav item that matches
          const hasMoreSpecificMatch = navItems.some(
            (other) => other.href !== item.href &&
                       other.href.startsWith(item.href + '/') &&
                       pathname.startsWith(other.href)
          )
          const isActive = hasMoreSpecificMatch
            ? false
            : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[rgba(22,51,0,0.08)] dark:bg-[rgba(159,232,112,0.12)] text-accent-green'
                  : 'text-content-secondary hover:bg-muted hover:text-content-primary'
              }`}
            >
              {isActive ? (item.activeIcon || item.icon) : item.icon}
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Sign out */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => { setMobileOpen(false); handleLogout() }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-content-secondary hover:bg-muted hover:text-destructive transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </nav>
  )

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-card border-b border-border">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-content-primary">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <MobileNavContent />
          </SheetContent>
        </Sheet>

        <h1 className="text-lg font-bold text-content-primary">{title}</h1>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-content-secondary"
            onClick={() => setMobileSearchOpen(true)}
          >
            <Search className="w-5 h-5" />
          </Button>
          <NotificationDropdown />
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile Search Sheet */}
      <MobileSearchSheet open={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)} />

      {/* Main Content */}
      <main className={`transition-all duration-200 ${sidebarCollapsed ? 'lg:pl-[74px]' : 'lg:pl-64'}`}>
        {/* Desktop Header */}
        <DesktopTopBar />

        {/* Page Content */}
        <div className="min-h-[calc(100vh-65px)] lg:min-h-[calc(100vh-64px)]">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            // Check if there's a more specific nav item that matches
            const hasMoreSpecificMatch = navItems.some(
              (other) => other.href !== item.href &&
                         other.href.startsWith(item.href + '/') &&
                         pathname.startsWith(other.href)
            )
            const isActive = hasMoreSpecificMatch
              ? false
              : pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 ${
                  isActive ? 'text-accent-green' : 'text-content-secondary'
                }`}
              >
                {isActive ? (item.activeIcon || item.icon) : item.icon}
                <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
