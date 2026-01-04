'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Bell, Calendar, Clock, AlertTriangle, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  getNotifications,
  markAsFollowedUp,
  type Notification,
  type NotificationType,
} from '@/actions/notifications'

interface NotificationDropdownProps {
  onCountChange?: (count: number) => void
}

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bgColor: string }> = {
  upcoming_interview: {
    icon: Calendar,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  stale: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  follow_up: {
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
}

export function NotificationDropdown({ onCountChange }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true
    const loadNotifications = async () => {
      const data = await getNotifications()
      if (!isMounted) return
      if (data) {
        setNotifications(data.notifications)
        onCountChange?.(data.count)
      }
      setIsLoading(false)
    }
    loadNotifications()
    return () => { isMounted = false }
  }, [onCountChange])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkFollowedUp = async (notification: Notification, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!notification.application.id) return

    setMarkingId(notification.id)
    const result = await markAsFollowedUp(notification.application.id)

    if (result.success) {
      toast.success('Marked as followed up')
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
      onCountChange?.(notifications.length - 1)
    } else {
      toast.error(result.error || 'Failed to mark as followed up')
    }
    setMarkingId(null)
  }

  const getTypeLabel = (type: NotificationType): string => {
    switch (type) {
      case 'upcoming_interview':
        return 'Upcoming Interview'
      case 'stale':
        return 'Needs Attention'
      case 'follow_up':
        return 'Follow Up'
      default:
        return 'Notification'
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors relative ${
          isOpen ? 'bg-muted' : 'hover:bg-muted'
        }`}
      >
        <Bell className="w-5 h-5 text-content-secondary" />
        {notifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-[340px] bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-content-primary">Notifications</h3>
            <p className="text-xs text-content-secondary">
              {notifications.length} pending action{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-content-tertiary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 text-content-tertiary" />
                <p className="text-sm text-content-secondary">All caught up!</p>
                <p className="text-xs text-content-tertiary text-center">
                  No follow-ups or upcoming interviews
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => {
                  const config = typeConfig[notification.type]
                  const Icon = config.icon

                  return (
                    <div key={notification.id} className="p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${config.color}`}>
                              {getTypeLabel(notification.type)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-content-primary truncate">
                            {notification.application.company}
                          </p>
                          <p className="text-xs text-content-secondary truncate">
                            {notification.application.position}
                          </p>
                          <p className="text-xs text-content-tertiary mt-1">
                            {notification.message}
                          </p>

                          {/* Actions */}
                          <div className="flex gap-2 mt-2">
                            {(notification.type === 'follow_up' || notification.type === 'stale') && (
                              <button
                                onClick={(e) => handleMarkFollowedUp(notification, e)}
                                disabled={markingId === notification.id}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-bright-green text-forest-green rounded-md hover:bg-[#8AD960] transition-colors disabled:opacity-50"
                              >
                                {markingId === notification.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                Followed Up
                              </button>
                            )}
                            <Link
                              href={`/tracker/${notification.application.id}`}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-content-secondary hover:text-content-primary border border-border rounded-md hover:bg-muted transition-colors"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
