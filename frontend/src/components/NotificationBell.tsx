import { useEffect, useState } from "react";
import { Bell, Check, ExternalLink, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";

// Shape returned by backend /api/notifications (backend/app/notifications.py)
interface Notification {
  notificationId: number;
  title: string;
  message: string;
  entityType: string | null;
  entityId: number | null;
  isRead: boolean;
  createdDate: string;
  fileName?: string;
  fileType?: string;
  redirectUrl?: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch notifications from backend
  // const fetchNotifications = async () => {
  //   setIsLoading(true);
  //   try {
  //     const token = localStorage.getItem("token");
  //     if (!token) {
  //       setNotifications([]);
  //       return;
  //     }

  //     const response = await fetch("https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/notifications", {
  //       method: "GET",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       if (data.success && Array.isArray(data.notifications)) {
  //         // Backend already sends camelCase keys matching our interface
  //         setNotifications(data.notifications as Notification[]);
  //       } else {
  //         setNotifications([]);
  //       }
  //     } else {
  //       setNotifications([]);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching notifications:", error);
  //     setNotifications([]);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Fetch on mount and set up polling
  // useEffect(() => {
  //   fetchNotifications();

  //   // Poll for new notifications every 30 seconds
  //   const interval = setInterval(fetchNotifications, 30000);

  //   return () => clearInterval(interval);
  // }, []);

  // Mark notification as read
  // const markAsRead = async (notificationId: number) => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     if (!token) return;

  //     const response = await fetch(
  //       "https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/notifications/mark-read",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //         body: JSON.stringify({ NotificationId: notificationId }),
  //       }
  //     );

  //     if (response.ok) {
  //       // Update local state
  //       setNotifications((prev) =>
  //         prev.map((n) =>
  //           n.notificationId === notificationId ? { ...n, isRead: true } : n
  //         )
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Error marking notification as read:", error);
  //   }
  // };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const resolveRedirectUrl = (notif: Notification): string => {
    if (notif.redirectUrl) {
      // Parse backend format: /file-management/onboarding/{OnboardingId}/files/{FileID}
      const match = notif.redirectUrl.match(
        /\/file-management\/onboarding\/(\d+)\/files\/(\d+)/
      );
      if (match) {
        const [, onboardingId, fileId] = match;
        return `/collaboration-hub?openReview=true&files=${fileId}&onboardingId=${onboardingId}`;
      }

      // Legacy format: /file-management/{FileID}
      const legacyMatch = notif.redirectUrl.match(/^\/file-management\/(\d+)$/);
      if (legacyMatch) {
        const fileId = legacyMatch[1];
        return `/collaboration-hub?openReview=true&files=${fileId}`;
      }

      // If it's already a valid frontend URL, use it as-is
      if (notif.redirectUrl.startsWith("/collaboration-hub")) {
        return notif.redirectUrl;
      }
    }

    // Fallback: use entityId if available
    if (notif.entityType === "FILE" && notif.entityId) {
      return `/collaboration-hub?openReview=true&files=${notif.entityId}`;
    }

    // Default: go to Collaboration Hub
    return "/collaboration-hub";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto">
        <div className="px-4 py-2 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {isLoading && <Loader className="w-4 h-4 animate-spin" />}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.notificationId}
                className="flex flex-col items-start gap-2 p-4 cursor-pointer hover:bg-muted"
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm flex items-center gap-2">
                      {notif.title}
                      {!notif.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {notif.message}
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(notif.createdDate).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* <div className="flex items-center gap-2 w-full justify-end">
                  {!notif.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif.notificationId);
                      }}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Mark Read
                    </Button>
                  )}

                  {notif.entityType === "FILE" && notif.entityId && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif.notificationId);
                        const targetUrl = resolveRedirectUrl(notif);
                        navigate(targetUrl);
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Review File
                    </Button>
                  )}
                </div> */}
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <div className="px-2 py-2 border-t">
          <Link
            to="/collaboration-hub"
            className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-muted rounded"
          >
            <ExternalLink className="w-4 h-4" />
            View all in Collaboration Hub
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;