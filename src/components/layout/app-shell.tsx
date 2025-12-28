'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Briefcase,
  User,
  MessageSquare,
  GraduationCap,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
  { href: '/tracker', label: 'Applications', icon: <Briefcase className="w-5 h-5" /> },
  { href: '/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  { href: '/assistant', label: 'AI Assistant', icon: <MessageSquare className="w-5 h-5" /> },
  { href: '/coach', label: 'Interview Coach', icon: <GraduationCap className="w-5 h-5" /> },
]

interface AppShellProps {
  children: React.ReactNode
  title?: string
  userName?: string | null
  actions?: React.ReactNode
}

export function AppShell({ children, title, userName, actions }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

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

  const NavContent = () => (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-black text-forest-green">NexCareer</h1>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[rgba(22,51,0,0.08)] text-forest-green'
                  : 'text-content-secondary hover:bg-muted hover:text-content-primary'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-content-secondary hover:bg-muted hover:text-destructive transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col bg-card border-r border-border">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-content-primary">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <NavContent />
          </SheetContent>
        </Sheet>

        <h1 className="text-lg font-bold text-content-primary">{title}</h1>

        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-6 py-4 bg-card border-b border-border">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">{title}</h1>
            {userName && (
              <p className="text-sm text-content-secondary">Welcome back, {userName}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>

        {/* Page Content */}
        <div className="min-h-[calc(100vh-65px)] lg:min-h-[calc(100vh-73px)]">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 ${
                  isActive ? 'text-forest-green' : 'text-content-secondary'
                }`}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.label.split(' ')[0]}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
