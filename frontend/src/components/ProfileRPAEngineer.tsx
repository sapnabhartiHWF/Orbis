import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Star,
  Mail,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle,
  User,
} from "lucide-react";

export function ProfileRPAEngineer() {
  const [pendingReviews, setPendingReviews] = useState(0);

  useEffect(() => {
    // Fetch pending notifications count from backend
    const fetchPendingCount = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("http://127.0.0.1:8000/api/notifications", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.notifications)) {
            const unreadCount = data.notifications.filter((n: any) => !n.IsRead).length;
            setPendingReviews(unreadCount);
          }
        }
      } catch (error) {
        console.error("Error fetching pending reviews:", error);
      }
    };

    fetchPendingCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);

    return () => clearInterval(interval);
  }, []);

  // Mock recent activities for a more lively UI
  const [activities] = useState([
    { id: 1, text: "Reviewed SOP for Invoice Processing", time: "2 days ago" },
    { id: 2, text: "Requested clarifications on flowchart", time: "5 days ago" },
    { id: 3, text: "Signed off on Credit Card process", time: "2 weeks ago" },
  ]);

  return (
    <div className="px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-indigo-50 to-white rounded-xl p-6 mb-6 shadow-lg border border-border">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 p-1">
                <Avatar className="w-28 h-28 text-white bg-transparent shadow-xl">R</Avatar>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold">RPA Engineer</h1>
                  <div className="text-sm text-muted-foreground mt-1">Role • RPA Engineer — Team • Automation Center</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" className="px-3">Message</Button>
                  <Link to="/collaboration-hub">
                    <Button className="px-4">Open File Manager</Button>
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg shadow-sm border">
                  <div className="text-xs text-muted-foreground">Pending Reviews</div>
                  <div className="text-2xl font-bold">{pendingReviews}</div>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border">
                  <div className="text-xs text-muted-foreground">Automations</div>
                  <div className="text-2xl font-bold">12</div>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border">
                  <div className="text-xs text-muted-foreground">Uptime</div>
                  <div className="text-2xl font-bold">99.9%</div>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border">
                  <div className="text-xs text-muted-foreground">Projects</div>
                  <div className="text-2xl font-bold">6</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">About</h3>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground">Email</div>
                    <div className="font-medium">rpa.engineer@example.com</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground">Location</div>
                    <div className="font-medium">London, UK</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground">Experience</div>
                    <div className="font-medium">4 years</div>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Skills</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">UiPath</Badge>
                    <Badge className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">Automation Anywhere</Badge>
                    <Badge className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">Process Mapping</Badge>
                    <Badge className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">Python</Badge>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <Button asChild>
                    <Link to="/collaboration-hub">Review Files</Link>
                  </Button>
                  <Button variant="outline">Edit Profile</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Pending Reviews</h3>
                    <div className="text-sm text-muted-foreground">Files that require your attention</div>
                  </div>
                  <div>
                    <Button variant="ghost">Manage</Button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg border shadow-sm">
                    <div className="text-xs text-muted-foreground">To Review</div>
                    <div className="text-3xl font-extrabold">{pendingReviews}</div>
                    <div className="text-sm text-muted-foreground mt-1">Awaiting your approval</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border shadow-sm">
                    <div className="text-xs text-muted-foreground">In Progress</div>
                    <div className="text-3xl font-extrabold">3</div>
                    <div className="text-sm text-muted-foreground mt-1">Under review by team</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border shadow-sm">
                    <div className="text-xs text-muted-foreground">Recently Reviewed</div>
                    <div className="text-3xl font-extrabold">8</div>
                    <div className="text-sm text-muted-foreground mt-1">Last 30 days</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-3">Recent Activity</h4>
                  <div className="space-y-3">
                    {activities.map((a) => (
                      <div key={a.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{a.text}</div>
                          <div className="text-xs text-muted-foreground">{a.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileRPAEngineer;
