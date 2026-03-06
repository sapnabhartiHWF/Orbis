import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Notification {
  NotificationId: number;
  Title: string;
  Message: string;
  IsRead: boolean;
  CreatedAt: string;
  EntityType?: string | null;
  EntityId?: number | null;
}

const formatProcessId = (processId: number | null | undefined): string => {
  if (!processId) return "";
  return `P${String(processId).padStart(3, "0")}`;
};

const renderHighlightedMessage = (notification: Notification) => {
  const raw = notification.Message || "";
  const processId = notification.EntityId;
  const formattedId = formatProcessId(processId);

  if (!formattedId) return raw;

  const match = raw.match(/\((\d+)\)\s*([^.]+)/);
  if (!match) {
    return (
      <>
        <span className="font-semibold text-primary">{formattedId}</span>{" "}
        {raw}
      </>
    );
  }

  const full = match[0];
  const processName = match[2]?.trim() || "";
  const [before, after] = raw.split(full);

  return (
    <>
      {before}
      <span className="font-semibold text-primary">
        {formattedId} {processName}
      </span>
      {after}
    </>
  );
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setNotifications([]);
          setUnreadCount(0);
          return;
        }

        const response = await fetch(
          "https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/team/notifications?page=1&pageSize=50",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setNotifications(data.data);
            setUnreadCount(
              data.data.filter((n: Notification) => !n.IsRead).length
            );
          } else {
            setNotifications([]);
            setUnreadCount(0);
          }
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        "https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/team/notifications/mark-read",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ NotificationId: notificationId }),
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.NotificationId === notificationId ? { ...n, IsRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleViewProcess = (processId: number | null | undefined) => {
    if (!processId) return;
    navigate("/center-of-excellence", {
      state: {
        // Land directly on the Approvals tab for review actions
        activeTab: "approvals",
        processId: String(processId),
      },
    });
  };

  return (
    <div className="min-h-screen bg-background px-8 py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="w-7 h-7 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Central inbox for approvals, stage updates, and automation alerts.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              All Notifications
              {unreadCount > 0 && (
                <Badge className="bg-destructive text-destructive-foreground">
                  {unreadCount} unread
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              View and manage notifications across all automation roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const processId = notification.EntityId;
                  const formattedProcessId = formatProcessId(processId);
                  return (
                    <div
                      key={notification.NotificationId}
                      className={`p-4 border rounded-lg ${
                        !notification.IsRead
                          ? "border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10"
                          : "border-border bg-muted/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold">
                              {notification.Title}
                            </h4>
                            {!notification.IsRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                            {formattedProcessId && (
                              <Badge
                                variant="outline"
                                className="font-mono"
                              >
                                {formattedProcessId}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {renderHighlightedMessage(notification)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              notification.CreatedAt
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {processId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewProcess(processId)}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View Process
                            </Button>
                          )}
                          {!notification.IsRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                markAsRead(notification.NotificationId)
                              }
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

