/**
 * Notification Center
 * In-app notification system with real-time updates
 */

import { useState } from 'react';
import { Bell, Check, X, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// Sample notifications
const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Business Idea Generated',
    message: 'Your new business idea "Eco-Friendly Packaging Solutions" is ready to view.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
    actionUrl: '/app/ideas',
  },
  {
    id: '2',
    type: 'info',
    title: 'Referral Reward',
    message: 'You earned $10 credit from a successful referral!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Tier Limit Approaching',
    message: 'You have generated 4 out of 5 free ideas this month.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
    actionUrl: '/pricing',
  },
  {
    id: '4',
    type: 'success',
    title: 'Document Created',
    message: 'Your Business Plan document has been successfully generated.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    read: true,
    actionUrl: '/app/documents',
  },
];

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTimestamp = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="all" className="flex-1">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-96">
            <TabsContent value="all" className="m-0">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      getTypeColor={getTypeColor}
                      formatTimestamp={formatTimestamp}
                      setOpen={setOpen}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="unread" className="m-0">
              {unreadNotifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All caught up!</p>
                </div>
              ) : (
                <div>
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      getTypeColor={getTypeColor}
                      formatTimestamp={formatTimestamp}
                      setOpen={setOpen}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {notifications.length > 0 && (
          <div className="p-2 border-t flex justify-between">
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear all
            </Button>
            <Button variant="ghost" size="sm">
              <SettingsIcon className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  getTypeColor,
  formatTimestamp,
  setOpen,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getTypeColor: (type: Notification['type']) => string;
  formatTimestamp: (date: Date) => string;
  setOpen: (open: boolean) => void;
}) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
      setOpen(false);
    }
  };

  return (
    <div
      className={`p-4 border-b hover:bg-accent cursor-pointer relative ${
        !notification.read ? 'bg-primary/5' : ''
      }`}
      onClick={handleClick}
    >
      {!notification.read && (
        <div className="absolute top-4 left-2 w-2 h-2 bg-primary rounded-full" />
      )}
      <div className="ml-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-medium text-sm flex items-center gap-2">
              <span className={getTypeColor(notification.type)}>●</span>
              {notification.title}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
            <p className="text-xs text-muted-foreground mt-2">{formatTimestamp(notification.timestamp)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
