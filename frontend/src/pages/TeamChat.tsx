import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Loader, Search, RefreshCw, Mail, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"

const API_BASE_URL = "http://127.0.0.1:8000"
const GET_EMAILS_URL = `${API_BASE_URL}/api/emails`

export default function TeamChat() {
  const { toast } = useToast()
  const navigate = useNavigate()

  const [emailConversations, setEmailConversations] = useState<any[]>([])
  const [selectedEmailConversation, setSelectedEmailConversation] = useState<any | null>(null)
  const [isLoadingEmails, setIsLoadingEmails] = useState(false)
  const [filterType, setFilterType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchEmailConversations()
  }, [])

  const fetchEmailConversations = async () => {
    setIsLoadingEmails(true)
    try {
      const response = await fetch(GET_EMAILS_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch email conversations")
      }

      const data = await response.json()
      const emails = Array.isArray(data) ? data : []
      setEmailConversations(emails)

      if (emails.length > 0 && !selectedEmailConversation) {
        setSelectedEmailConversation(emails[0])
      }
    } catch (error: any) {
      console.error("Error fetching email conversations:", error)
      toast({
        title: "Error loading Team Chat",
        description: error.message || "Failed to load email conversations",
        variant: "destructive",
      })
      setEmailConversations([])
    } finally {
      setIsLoadingEmails(false)
    }
  }

  const filteredEmails = emailConversations.filter((email: any) => {
    const subject = String(email.subject || email.Subject || "").toLowerCase()
    const body = String(email.body || email.Body || "").toLowerCase()
    const from = String(email.from || email.From || "").toLowerCase()

    const matchesSearch =
      !searchQuery ||
      subject.includes(searchQuery.toLowerCase()) ||
      body.includes(searchQuery.toLowerCase()) ||
      from.includes(searchQuery.toLowerCase())

    const matchesType = filterType === "all"

    return matchesSearch && matchesType
  })

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-gradient-to-br from-violet-500 to-purple-600",
      "bg-gradient-to-br from-blue-500 to-cyan-600",
      "bg-gradient-to-br from-emerald-500 to-teal-600",
      "bg-gradient-to-br from-orange-500 to-red-600",
      "bg-gradient-to-br from-pink-500 to-rose-600",
      "bg-gradient-to-br from-indigo-500 to-blue-600",
    ]
    const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Team Chat
                </h1>
                <p className="text-sm text-slate-600 mt-0.5">
                  Centralized view of email conversations linked to your automation projects
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/tickets")}
            className="border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            Back to Tickets
          </Button>
        </div>

        {/* Main Card */}
        <Card className="flex-1 mx-6 mb-6 border-slate-200/60 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm overflow-hidden flex flex-col">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Mail className="w-5 h-5 text-blue-600" />
                Conversations
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-[280px] border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px] border-slate-200 bg-white">
                    <SelectValue placeholder="All Chats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chats</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="flex gap-0 divide-x divide-slate-100 h-full">
              {/* Chat list */}
              <div className="w-[42rem] bg-slate-50/50 flex-shrink-0 flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-white/60 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Conversations ({filteredEmails.length})
                    </h4>
                    <div className="flex items-center gap-2 my-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2.5 text-xs hover:bg-blue-50 hover:text-blue-600 transition-all"
                      onClick={fetchEmailConversations}
                      disabled={isLoadingEmails}
                    >
                      {isLoadingEmails ? (
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          Refresh
                        </>
                      )}
                    </Button>
                    </div>
                  </div>
                </div>
                <ScrollArea className="flex-1 overflow-y-auto">
                  <div className="space-y-0.5 p-3">
                    {isLoadingEmails ? (
                      <div className="flex flex-col items-center justify-center py-16 space-y-3">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-sm text-slate-500">Loading conversations...</p>
                      </div>
                    ) : filteredEmails && filteredEmails.length > 0 ? (
                      filteredEmails.map((email: any, index: number) => {
                        const emailId = email.emaildetailsid ?? index
                        const senderName = email.from || "Unknown sender"
                        const subject = email.subject || "No subject"
                        const previewText = email.body || ""
                        const isSelected =
                          selectedEmailConversation &&
                          (selectedEmailConversation.emaildetailsid ?? -1) === emailId

                        const nameParts = String(senderName).split(" ")
                        const avatarInitials =
                          nameParts.length >= 2
                            ? `${nameParts[0][0] || ""}${nameParts[1][0] || ""}`.toUpperCase()
                            : (nameParts[0]?.[0] || "U").toUpperCase()

                        return (
                          <div
                            key={emailId}
                            className={`group flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 scale-[1.02]"
                                : "bg-white hover:bg-slate-50 hover:shadow-md border border-transparent hover:border-slate-200"
                            }`}
                            onClick={() => setSelectedEmailConversation(email)}
                          >
                            <Avatar className={`w-11 h-11 flex-shrink-0 ring-2 ${
                              isSelected ? "ring-white/30" : "ring-transparent group-hover:ring-slate-200"
                            } transition-all`}>
                              <AvatarFallback className={`text-sm font-semibold text-white ${
                                isSelected ? "bg-white/20" : getAvatarColor(senderName)
                              }`}>
                                {avatarInitials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-sm font-semibold truncate ${
                                  isSelected ? "text-white" : "text-slate-800"
                                }`}>
                                  {senderName}
                                </span>
                                <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${
                                  isSelected 
                                    ? "text-white translate-x-0" 
                                    : "text-slate-400 -translate-x-1 group-hover:translate-x-0"
                                }`} />
                              </div>
                              <p className={`text-xs font-medium truncate ${
                                isSelected ? "text-blue-100" : "text-slate-700"
                              }`}>
                                {subject}
                              </p>
                              <p className={`text-xs line-clamp-2 leading-relaxed ${
                                isSelected ? "text-blue-200/90" : "text-slate-500"
                              }`}>
                                {previewText}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-16 space-y-4">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                          <MessageSquare className="w-8 h-8 text-slate-400" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-700">No conversations found</p>
                          <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                            Emails from the integrated mailbox will appear here
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Conversation detail */}
              <div className="flex-1 flex flex-col bg-white">
                {selectedEmailConversation ? (
                  <>
                    {/* Header */}
                    <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50/30 backdrop-blur-sm sticky top-0 z-10">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <h3 className="text-lg font-semibold text-slate-800 truncate">
                            {selectedEmailConversation.subject || "No subject"}
                          </h3>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className={`text-xs font-semibold text-white ${
                                  getAvatarColor(selectedEmailConversation.from || "")
                                }`}>
                                  {(() => {
                                    const senderName = selectedEmailConversation.from || "Unknown"
                                    const parts = String(senderName).split(" ")
                                    return parts.length >= 2
                                      ? `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase()
                                      : (parts[0]?.[0] || "U").toUpperCase()
                                  })()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-slate-700">
                                {selectedEmailConversation.from}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                              <Mail className="w-3 h-3 mr-1" />
                              Email
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            To: {selectedEmailConversation.to}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Message content */}
                    <ScrollArea className="flex-1">
                      <div className="p-6 space-y-4">
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/60 rounded-2xl p-5 shadow-sm">
                          <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                            {selectedEmailConversation.body}
                          </p>
                        </div>
                      </div>
                    </ScrollArea>


                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4 py-16">
                      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
                        <MessageSquare className="w-10 h-10 text-slate-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-medium text-slate-700">No conversation selected</p>
                        <p className="text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                          Choose a conversation from the list to view its details
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}