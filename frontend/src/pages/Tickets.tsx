import { useState, useEffect, useRef } from "react"
import { 
  Ticket, 
  Search, 
  Filter, 
  Plus, 
  MessageSquare, 
  Paperclip, 
  Send,
  Users,
  Clock,
  AlertTriangle,
  Lightbulb,
  FileText,
  Link,
  Calendar,
  User,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  Edit,
  MoreHorizontal,
  Settings,
  Download,
  Upload,
  Phone,
  Video,
  ChevronRight,
  Star,
  Flag,
  Trash2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { getExceptionSummary } from "@/utils/ticketExceptionIntegration"
import { Loader } from "lucide-react"

// API URLs
const API_BASE_URL = "https://basic-vivyan-vivek1902-64809d2b.koyeb.app/"
const GET_TICKETS_URL = `${API_BASE_URL}/api/get_tickets`
const ADD_TICKET_URL = `${API_BASE_URL}/api/add_ticket`
const UPDATE_TICKET_URL = `${API_BASE_URL}/api/update_ticket`
const DELETE_TICKET_URL = `${API_BASE_URL}/api/delete_ticket`
const DOWNLOAD_ATTACHMENT_URL = `${API_BASE_URL}/api/download_ticket_attachment`
const GET_USERS_URL = `${API_BASE_URL}/api/users`
const ADD_TICKET_CHAT_URL = `${API_BASE_URL}/api/add_ticket_chat`
const GET_TICKET_CHAT_URL = `${API_BASE_URL}/api/get_ticket_chat`

// Ticket interface matching API response
interface TicketData {
  Tid: number
  Title: string
  Description: string
  Type: string
  Priority: string
  AttachmentPath: string | null
  CreatedDate: string
  UpdatedDate: string | null
  IsDeleted: boolean
  CreatedById: number
  CreatedByName: string
  AssignedUsers: Array<{
    UserId: number
    FirstName: string
    LastName: string
    Email: string
    AssignDate: string
  }>
  AssignedUserNames: string | null
}

// Frontend ticket format
interface Ticket {
  id: string
  title: string
  type: string
  priority: string
  status: string
  assignee: string
  assigneeAvatar: string
  assignedUsers: Array<{
    UserId: number
    FirstName: string
    LastName: string
    Email: string
    AssignDate: string
  }>
  assignedUserNames: string
  reporter: string
  created: string
  updated: string
  slaDeadline?: string
  description: string
  linkedRules: string[]
  linkedExceptions: string[]
  attachments: string[]
  tags: string[]
  estimatedHours?: number
  messages: Array<{
    id: number
    author: string
    avatar: string
    timestamp: string
    message: string
  }>
}

// Chat message interface matching API response
interface ChatMessage {
  ChatId: number
  TicketId: number
  SendById: number
  SendByName: string
  SendToId: number | null
  SendToName: string | null
  Message: string
  ParentChatId: number | null
  CreatedAt: string
  IsDeleted: boolean
  Replies?: Array<{
    ChatId: number
    TicketId: number
    SendById: number
    ReplySendByName?: string  // Replies use different field names
    SendByName?: string
    SendToId: number | null
    ReplySendToName?: string  // Replies use different field names
    SendToName?: string | null
    Message: string
    ParentChatId: number | null
    CreatedAt: string
    IsDeleted: boolean
  }>
}

// Helper function to map API ticket to frontend format
const mapTicketToFrontend = (apiTicket: TicketData): Ticket => {
  const assignedUsers = apiTicket.AssignedUsers && Array.isArray(apiTicket.AssignedUsers) && apiTicket.AssignedUsers.length > 0
    ? apiTicket.AssignedUsers
    : []
  
  const assignedUser = assignedUsers.length > 0 ? assignedUsers[0] : null
  
  const assigneeName = assignedUser 
    ? `${assignedUser.FirstName} ${assignedUser.LastName}`.trim()
    : "Unassigned"
  
  const assigneeAvatar = assignedUser
    ? `${(assignedUser.FirstName || "")[0] || ""}${(assignedUser.LastName || "")[0] || ""}`.toUpperCase()
    : "NA"

  // Get assigned user names (comma-separated) or from the array
  const assignedUserNames = apiTicket.AssignedUserNames || 
    (assignedUsers.length > 0 
      ? assignedUsers.map(u => `${u.FirstName || ""} ${u.LastName || ""}`.trim()).filter(Boolean).join(", ")
      : "")

  // Store full attachment path for download
  const attachments = apiTicket.AttachmentPath ? [apiTicket.AttachmentPath] : []

  return {
    id: `TKT-${apiTicket.Tid.toString().padStart(3, '0')}`,
    title: apiTicket.Title,
    type: apiTicket.Type,
    priority: apiTicket.Priority?.toLowerCase() || "medium",
    status: "open", // Default status as API doesn't return status
    assignee: assigneeName,
    assigneeAvatar: assigneeAvatar,
    assignedUsers: assignedUsers,
    assignedUserNames: assignedUserNames,
    reporter: apiTicket.CreatedByName,
    created: apiTicket.CreatedDate,
    updated: apiTicket.UpdatedDate || apiTicket.CreatedDate,
    description: apiTicket.Description,
    linkedRules: [],
    linkedExceptions: [],
    attachments: attachments,
    tags: [],
    messages: []
  }
}

// Helper function to extract original filename (remove timestamp prefix)
const getOriginalFileName = (filePath: string): string => {
  // Extract filename from path
  const fileName = filePath.split(/[/\\]/).pop() || filePath
  
  // Remove timestamp prefix pattern: YYYYMMDDHHMMSS_ (14 digits followed by underscore)
  const timestampPattern = /^\d{14}_/
  const originalName = fileName.replace(timestampPattern, '')
  
  return originalName || fileName
}

// Helper function to truncate filename with ellipsis
const truncateFileName = (fileName: string, maxLength: number = 40): string => {
  if (fileName.length <= maxLength) {
    return fileName
  }
  // Keep extension, truncate name part
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot === -1) {
    // No extension, just truncate
    return fileName.substring(0, maxLength - 3) + '...'
  }
  const extension = fileName.substring(lastDot)
  const nameWithoutExt = fileName.substring(0, lastDot)
  const maxNameLength = maxLength - extension.length - 3 // 3 for '...'
  if (nameWithoutExt.length <= maxNameLength) {
    return fileName
  }
  return nameWithoutExt.substring(0, maxNameLength) + '...' + extension
}

// Mock team members for chat
const teamMembers = []

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [newMessage, setNewMessage] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showChatPanel, setShowChatPanel] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [users, setUsers] = useState<Array<{ UserId: number; FirstName: string; LastName: string; Email: string }>>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [sendToUserId, setSendToUserId] = useState<number | null>(null)
  
  // Form state
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formType, setFormType] = useState("")
  const [formPriority, setFormPriority] = useState("")
  const [formAssignedUserIds, setFormAssignedUserIds] = useState<string[]>([])
  const [formAttachment, setFormAttachment] = useState<File | null>(null)
  const [keepExistingAttachment, setKeepExistingAttachment] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  
  const { toast } = useToast()

  // Fetch tickets and users on mount
  useEffect(() => {
    fetchTickets()
    fetchUsers()
  }, [])

  const 
  fetchUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setIsLoadingUsers(false)
        return
      }

      const response = await fetch(GET_USERS_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      if (data.success && data.data) {
        setUsers(data.data)
      }
    } catch (error: any) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error fetching users",
        description: "Failed to load user list",
        variant: "destructive"
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleUserToggle = (userId: number) => {
    const userIdStr = userId.toString()
    setFormAssignedUserIds(prev => {
      if (prev.includes(userIdStr)) {
        return prev.filter(id => id !== userIdStr)
      } else {
        return [...prev, userIdStr]
      }
    })
  }

  const getSelectedUserNames = () => {
    return formAssignedUserIds
      .map(id => {
        const user = users.find(u => u.UserId.toString() === id)
        return user ? `${user.FirstName} ${user.LastName}`.trim() : null
      })
      .filter(Boolean)
      .join(", ")
  }

  const fetchTickets = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to view tickets.",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }

      const response = await fetch(GET_TICKETS_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch tickets")
      }

      const data = await response.json()
      
      if (data.success && data.tickets) {
        const mappedTickets = data.tickets.map(mapTicketToFrontend)
        setTickets(mappedTickets)
        
        // Select first ticket if available
        if (mappedTickets.length > 0 && !selectedTicket) {
          setSelectedTicket(mappedTickets[0])
        }
      } else {
        setTickets([])
      }
    } catch (error: any) {
      console.error("Error fetching tickets:", error)
      toast({
        title: "Error fetching tickets",
        description: error.message || "Failed to load tickets",
        variant: "destructive"
      })
      setTickets([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || ticket.type === filterType
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus
    const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority
    return matchesSearch && matchesType && matchesStatus && matchesPriority
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive bg-destructive/10 border-destructive/20'
      case 'medium': return 'text-warning bg-warning/10 border-warning/20'
      case 'low': return 'text-success bg-success/10 border-success/20'
      default: return 'text-muted-foreground bg-muted/10 border-border'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-destructive bg-destructive/10 border-destructive/20'
      case 'in-progress': return 'text-warning bg-warning/10 border-warning/20'
      case 'resolved': return 'text-success bg-success/10 border-success/20'
      case 'closed': return 'text-muted-foreground bg-muted/10 border-border'
      default: return 'text-muted-foreground bg-muted/10 border-border'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Error': return <AlertTriangle className="w-4 h-4" />
      case 'Feedback': return <MessageSquare className="w-4 h-4" />
      case 'New Process': return <Lightbulb className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <ArrowUp className="w-3 h-3" />
      case 'medium': return <Minus className="w-3 h-3" />
      case 'low': return <ArrowDown className="w-3 h-3" />
      default: return <Minus className="w-3 h-3" />
    }
  }

  const fetchChatMessages = async () => {
    if (!selectedTicket) return

    setIsLoadingChat(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setIsLoadingChat(false)
        return
      }

      // Extract Tid from ticket id (format: "TKT-001")
      const tidMatch = selectedTicket.id.match(/TKT-(\d+)/)
      if (!tidMatch) {
        setIsLoadingChat(false)
        return
      }
      const tid = parseInt(tidMatch[1])

      const response = await fetch(`${GET_TICKET_CHAT_URL}?TicketId=${tid}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch chat messages")
      }

      const data = await response.json()
      if (data.success && data.chats) {
        setChatMessages(data.chats)
      } else {
        setChatMessages([])
      }
    } catch (error: any) {
      console.error("Error fetching chat messages:", error)
      toast({
        title: "Error fetching messages",
        description: "Failed to load chat messages",
        variant: "destructive"
      })
      setChatMessages([])
    } finally {
      setIsLoadingChat(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) {
      return
    }

    setIsSendingMessage(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to send messages.",
          variant: "destructive"
        })
        setIsSendingMessage(false)
        return
      }

      // Extract Tid from ticket id (format: "TKT-001")
      const tidMatch = selectedTicket.id.match(/TKT-(\d+)/)
      if (!tidMatch) {
        throw new Error("Invalid ticket ID format")
      }
      const tid = parseInt(tidMatch[1])

      const response = await fetch(ADD_TICKET_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          TicketId: tid,
          Message: newMessage.trim(),
          SendToId: sendToUserId, // Selected user ID or null for general chat
          ParentChatId: null // Top-level message, can be updated later for replies
        }),
      })

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type")
      let data
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()
        throw new Error(`Server returned ${response.status}: ${response.statusText}. ${text.substring(0, 100)}`)
      }

      if (!response.ok || !data.success) {
        // Extract user-friendly error message
        let errorMessage = "Failed to send message. Please try again."
        if (data.message) {
          // Hide technical database errors from users
          if (data.message.includes("NULL") || data.message.includes("column does not allow nulls")) {
            errorMessage = "Unable to send message. Please select a recipient or try again."
          } else if (data.message.includes("Cannot insert")) {
            errorMessage = "Unable to send message. Please try again."
          } else {
            errorMessage = data.message
          }
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Message sent",
        description: sendToUserId 
          ? `Your message has been sent to ${users.find(u => u.UserId === sendToUserId)?.FirstName || 'user'}.`
          : "Your message has been added to the ticket thread."
      })
      setNewMessage("")
      setSendToUserId(null) // Reset sendTo selection

      // Refresh chat messages
      await fetchChatMessages()
    } catch (error: any) {
      // Only log to console, don't show technical errors to user
      console.error("Error sending message:", error)
      
      // Show user-friendly error message
      const userFriendlyMessage = error.message && !error.message.includes("NULL") && !error.message.includes("column")
        ? error.message
        : "Unable to send message. Please try again."
      
      toast({
        title: "Failed to send message",
        description: userFriendlyMessage,
        variant: "destructive"
      })
    } finally {
      setIsSendingMessage(false)
    }
  }

  // Fetch chat messages when ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      fetchChatMessages()
    } else {
      setChatMessages([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicket?.id]) // Only depend on ticket ID to avoid infinite loops

  const handleCreateTicket = async () => {
    if (!formTitle.trim()) {
      toast({
        title: "Missing information",
        description: "Title is required.",
        variant: "destructive"
      })
      return
    }
    if (formAssignedUserIds.length === 0) {
      toast({
        title: "Missing information",
        description: "Please assign at least one user.",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to create tickets.",
          variant: "destructive"
        })
        setIsCreating(false)
        return
      }

      const formData = new FormData()
      formData.append("Title", formTitle.trim())
      if (formDescription.trim()) {
        formData.append("Description", formDescription.trim())
      }
      if (formType) {
        formData.append("Type", formType)
      }
      if (formPriority) {
        formData.append("Priority", formPriority)
      }
      
      // Convert user ID strings to integers for JSON array
      if (formAssignedUserIds.length > 0) {
        const userIdsInt = formAssignedUserIds.map(id => parseInt(id)).filter(id => !isNaN(id))
        formData.append("AssignedUserIds", JSON.stringify(userIdsInt))
      }
      
      if (formAttachment) {
        formData.append("Attachment", formAttachment)
      }

      const response = await fetch(ADD_TICKET_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type")
      let data
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        // If not JSON, get text response for error message
        const text = await response.text()
        throw new Error(`Server returned ${response.status}: ${response.statusText}. ${text.substring(0, 100)}`)
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create ticket")
      }

      toast({
        title: "Ticket created",
        description: "New ticket has been created successfully."
      })

      // Reset form
      setFormTitle("")
      setFormDescription("")
      setFormType("")
      setFormPriority("")
      setFormAssignedUserIds([])
      setFormAttachment(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setShowCreateDialog(false)

      // Refresh tickets list
      await fetchTickets()
    } catch (error: any) {
      console.error("Error creating ticket:", error)
      toast({
        title: "Failed to create ticket",
        description: error.message || "An error occurred while creating the ticket",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTicket = async () => {
    if (!selectedTicket) {
      return
    }

    setIsDeleting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to delete tickets.",
          variant: "destructive"
        })
        setIsDeleting(false)
        return
      }

      // Extract Tid from ticket id (format: "TKT-001")
      const tidMatch = selectedTicket.id.match(/TKT-(\d+)/)
      if (!tidMatch) {
        throw new Error("Invalid ticket ID format")
      }
      const tid = parseInt(tidMatch[1])

      const response = await fetch(`${DELETE_TICKET_URL}?Tid=${tid}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete ticket")
      }

      toast({
        title: "Ticket deleted",
        description: data.message || "Ticket has been deleted successfully."
      })

      // Clear selected ticket
      setSelectedTicket(null)
      setShowDeleteDialog(false)

      // Refresh tickets list
      await fetchTickets()
    } catch (error: any) {
      console.error("Error deleting ticket:", error)
      toast({
        title: "Failed to delete ticket",
        description: error.message || "An error occurred while deleting the ticket",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditTicket = () => {
    if (!selectedTicket) return
    
    // Extract Tid from ticket id (format: "TKT-001")
    const tidMatch = selectedTicket.id.match(/TKT-(\d+)/)
    if (!tidMatch) return
    
    // Populate form with existing ticket data
    setFormTitle(selectedTicket.title)
    setFormDescription(selectedTicket.description)
    setFormType(selectedTicket.type)
    setFormPriority(selectedTicket.priority)
    setFormAssignedUserIds(selectedTicket.assignedUsers.map(u => u.UserId.toString()))
    setFormAttachment(null)
    setKeepExistingAttachment(selectedTicket.attachments.length > 0)
    setShowEditDialog(true)
  }

  const handleUpdateTicket = async () => {
    if (!selectedTicket || !formTitle.trim()) {
      toast({
        title: "Missing information",
        description: "Title is required.",
        variant: "destructive"
      })
      return
    }
    if (formAssignedUserIds.length === 0) {
      toast({
        title: "Missing information",
        description: "Please assign at least one user.",
        variant: "destructive"
      })
      return
    }

    setIsUpdating(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to update tickets.",
          variant: "destructive"
        })
        setIsUpdating(false)
        return
      }

      // Extract Tid from ticket id (format: "TKT-001")
      const tidMatch = selectedTicket.id.match(/TKT-(\d+)/)
      if (!tidMatch) {
        throw new Error("Invalid ticket ID format")
      }
      const tid = parseInt(tidMatch[1])

      const formData = new FormData()
      formData.append("Tid", tid.toString())
      formData.append("Title", formTitle.trim())
      if (formDescription.trim()) {
        formData.append("Description", formDescription.trim())
      }
      if (formType) {
        formData.append("Type", formType)
      }
      if (formPriority) {
        formData.append("Priority", formPriority)
      }
      formData.append("KeepExistingAttachment", keepExistingAttachment.toString())
      
      // Convert user ID strings to integers for JSON array
      if (formAssignedUserIds.length > 0) {
        const userIdsInt = formAssignedUserIds.map(id => parseInt(id)).filter(id => !isNaN(id))
        formData.append("AssignedUserIds", JSON.stringify(userIdsInt))
      } else {
        formData.append("AssignedUserIds", "[]")
      }
      
      if (formAttachment) {
        formData.append("Attachment", formAttachment)
      }

      const response = await fetch(UPDATE_TICKET_URL, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type")
      let data
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        // If not JSON, get text response for error message
        const text = await response.text()
        throw new Error(`Server returned ${response.status}: ${response.statusText}. ${text.substring(0, 100)}`)
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update ticket")
      }

      toast({
        title: "Ticket updated",
        description: "Ticket has been updated successfully."
      })

      // Reset form
      setFormTitle("")
      setFormDescription("")
      setFormType("")
      setFormPriority("")
      setFormAssignedUserIds([])
      setFormAttachment(null)
      setKeepExistingAttachment(false)
      if (editFileInputRef.current) {
        editFileInputRef.current.value = ""
      }
      setShowEditDialog(false)

      // Refresh tickets list
      await fetchTickets()
    } catch (error: any) {
      console.error("Error updating ticket:", error)
      toast({
        title: "Failed to update ticket",
        description: error.message || "An error occurred while updating the ticket",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ticketing & Collaboration</h1>
            <p className="text-muted-foreground">Integrated support and team communication</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShowChatPanel(!showChatPanel)}
            >
              <MessageSquare className="w-4 h-4" />
              Team Chat
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary gap-2">
                  <Plus className="w-4 h-4" />
                  New Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ticket-type">Type</Label>
                      <Select value={formType} onValueChange={setFormType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Error">Error</SelectItem>
                          <SelectItem value="Feedback">Feedback</SelectItem>
                          <SelectItem value="New Process">New Process</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formPriority} onValueChange={setFormPriority}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                    <Input 
                      id="title" 
                      placeholder="Brief description of the issue or request" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Detailed description..."
                      className="min-h-[100px] border border-gray-200 rounded-md p-2"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Assign To <span className="text-red-500">*</span></Label>
                    <Popover open={isUserDropdownOpen} onOpenChange={setIsUserDropdownOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            formAssignedUserIds.length === 0 ? 'border-destructive' : ''
                          }`}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          {formAssignedUserIds.length > 0 
                            ? `${formAssignedUserIds.length} user${formAssignedUserIds.length > 1 ? 's' : ''} selected`
                            : "Select users to assign"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <div className="p-2">
                          <div className="text-sm font-medium mb-2 px-2">Select Users</div>
                          <ScrollArea className="h-[300px]">
                            {isLoadingUsers ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
                              </div>
                            ) : !users || users.length === 0 ? (
                              <div className="text-center text-sm text-muted-foreground py-8">
                                No users available
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {users.map((user) => {
                                  if (!user || !user.UserId) return null
                                  
                                  const userIdStr = user.UserId.toString()
                                  const isSelected = formAssignedUserIds.includes(userIdStr)
                                  const firstName = user.FirstName || ""
                                  const lastName = user.LastName || ""
                                  const userName = `${firstName} ${lastName}`.trim() || "Unknown User"
                                  const avatarInitials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "U"
                                  
                                  return (
                                    <div
                                      key={user.UserId}
                                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                                      onClick={() => handleUserToggle(user.UserId)}
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => handleUserToggle(user.UserId)}
                                      />
                                      <div className="flex items-center gap-2 flex-1">
                                        <Avatar className="w-6 h-6">
                                          <AvatarFallback className="text-xs">
                                            {avatarInitials}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <div className="text-sm font-medium">{userName}</div>
                                          <div className="text-xs text-muted-foreground">{user.Email || ""}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </PopoverContent>
                    </Popover>
                    {formAssignedUserIds.length > 0 && users && users.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formAssignedUserIds.map((userIdStr) => {
                          const user = users.find(u => u && u.UserId && u.UserId.toString() === userIdStr)
                          if (!user) return null
                          const firstName = user.FirstName || ""
                          const lastName = user.LastName || ""
                          const userName = `${firstName} ${lastName}`.trim() || "Unknown User"
                          return (
                            <Badge
                              key={userIdStr}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {userName}
                              <button
                                onClick={() => handleUserToggle(parseInt(userIdStr))}
                                className="ml-1 hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Attachments</Label>
                    <div 
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {formAttachment 
                          ? formAttachment.name 
                          : "Drop files here or click to browse"}
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFormAttachment(e.target.files[0])
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateDialog(false)
                        setFormTitle("")
                        setFormDescription("")
                        setFormType("")
                        setFormPriority("")
                        setFormAssignedUserIds([])
                        setFormAttachment(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ""
                        }
                      }}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateTicket} 
                      className="bg-gradient-primary"
                      disabled={isCreating || !formTitle.trim() || formAssignedUserIds.length === 0}
                    >
                      {isCreating ? "Creating..." : "Create Ticket"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Edit Ticket Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-ticket-type">Type</Label>
                      <Select value={formType} onValueChange={setFormType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Error">Error</SelectItem>
                          <SelectItem value="Feedback">Feedback</SelectItem>
                          <SelectItem value="New Process">New Process</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-priority">Priority</Label>
                      <Select value={formPriority} onValueChange={setFormPriority}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title <span className="text-red-500">*</span></Label>
                    <Input 
                      id="edit-title" 
                      placeholder="Brief description of the issue or request" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea 
                      id="edit-description" 
                      placeholder="Detailed description..."
                      className="min-h-[100px] border border-gray-200 rounded-md p-2"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Assign To <span className="text-red-500">*</span></Label>
                    <Popover open={isUserDropdownOpen} onOpenChange={setIsUserDropdownOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            formAssignedUserIds.length === 0 ? 'border-destructive' : ''
                          }`}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          {formAssignedUserIds.length > 0 
                            ? `${formAssignedUserIds.length} user${formAssignedUserIds.length > 1 ? 's' : ''} selected`
                            : "Select users to assign"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <div className="p-2">
                          <div className="text-sm font-medium mb-2 px-2">Select Users</div>
                          <ScrollArea className="h-[300px]">
                            {isLoadingUsers ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
                              </div>
                            ) : !users || users.length === 0 ? (
                              <div className="text-center text-sm text-muted-foreground py-8">
                                No users available
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {users.map((user) => {
                                  if (!user || !user.UserId) return null
                                  
                                  const userIdStr = user.UserId.toString()
                                  const isSelected = formAssignedUserIds.includes(userIdStr)
                                  const firstName = user.FirstName || ""
                                  const lastName = user.LastName || ""
                                  const userName = `${firstName} ${lastName}`.trim() || "Unknown User"
                                  const avatarInitials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "U"
                                  
                                  return (
                                    <div
                                      key={user.UserId}
                                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                                      onClick={() => handleUserToggle(user.UserId)}
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => handleUserToggle(user.UserId)}
                                      />
                                      <div className="flex items-center gap-2 flex-1">
                                        <Avatar className="w-6 h-6">
                                          <AvatarFallback className="text-xs">
                                            {avatarInitials}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <div className="text-sm font-medium">{userName}</div>
                                          <div className="text-xs text-muted-foreground">{user.Email || ""}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </PopoverContent>
                    </Popover>
                    {formAssignedUserIds.length > 0 && users && users.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formAssignedUserIds.map((userIdStr) => {
                          const user = users.find(u => u && u.UserId && u.UserId.toString() === userIdStr)
                          if (!user) return null
                          const firstName = user.FirstName || ""
                          const lastName = user.LastName || ""
                          const userName = `${firstName} ${lastName}`.trim() || "Unknown User"
                          return (
                            <Badge
                              key={userIdStr}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {userName}
                              <button
                                onClick={() => handleUserToggle(parseInt(userIdStr))}
                                className="ml-1 hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Attachments</Label>
                    {selectedTicket && selectedTicket.attachments.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          id="keep-attachment"
                          checked={keepExistingAttachment}
                          onCheckedChange={(checked) => setKeepExistingAttachment(checked === true)}
                        />
                        <Label htmlFor="keep-attachment" className="text-sm font-normal cursor-pointer">
                          Keep existing attachment: {getOriginalFileName(selectedTicket.attachments[0])}
                        </Label>
                      </div>
                    )}
                    <div 
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => editFileInputRef.current?.click()}
                    >
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {formAttachment 
                          ? formAttachment.name 
                          : "Drop files here or click to browse (optional)"}
                      </p>
                      <input
                        ref={editFileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFormAttachment(e.target.files[0])
                            setKeepExistingAttachment(false)
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowEditDialog(false)
                        setFormTitle("")
                        setFormDescription("")
                        setFormType("")
                        setFormPriority("")
                        setFormAssignedUserIds([])
                        setFormAttachment(null)
                        setKeepExistingAttachment(false)
                        if (editFileInputRef.current) {
                          editFileInputRef.current.value = ""
                        }
                      }}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdateTicket} 
                      className="bg-gradient-primary"
                      disabled={isUpdating || !formTitle.trim() || formAssignedUserIds.length === 0}
                    >
                      {isUpdating ? "Updating..." : "Update Ticket"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Tickets</p>
                  <p className="text-2xl font-bold">{tickets.filter(t => t.status === "open").length}</p>
                  <p className="text-xs text-warning">{tickets.filter(t => t.priority === "high" && t.status === "open").length} high priority</p>
                </div>
                <Ticket className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-warning">{tickets.filter(t => t.status === "in-progress").length}</p>
                  <p className="text-xs text-success">{tickets.filter(t => t.status === "in-progress").length} this week</p>
                </div>
                <Settings className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Resolution</p>
                  <p className="text-2xl font-bold text-success">0m</p>
                  <p className="text-xs text-success">0m improvement</p>
                </div>
                <Clock className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Team Online</p>
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-xs text-muted-foreground">of 0 members</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket List */}
          <Card className="lg:col-span-2 bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Support Tickets
              </CardTitle>
              
              {/* Filters */}
              <div className="flex gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Error">Error</SelectItem>
                    <SelectItem value="Feedback">Feedback</SelectItem>
                    <SelectItem value="New Process">New Process</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent>
              <ScrollArea className="h-[600px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <Ticket className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {tickets.length === 0 
                        ? "No tickets found. Create your first ticket to get started."
                        : "No tickets match your filters."}
                    </p>
                  </div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      {/* <TableHead>Status</TableHead> */}
                      <TableHead>Assignee</TableHead>
                      <TableHead>SLA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow 
                        key={ticket.id}
                        className={`cursor-pointer transition-colors ${
                          selectedTicket?.id === ticket.id 
                            ? 'bg-primary/5 border-l-4 border-l-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{ticket.id}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {ticket.title}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(ticket.type)}
                            <span className="text-sm">{ticket.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            <div className="flex items-center gap-1">
                              {getPriorityIcon(ticket.priority)}
                              {ticket.priority}
                            </div>
                          </Badge>
                        </TableCell>
                        {/* <TableCell>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.replace('-', ' ')}
                          </Badge>
                        </TableCell> */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">{ticket.assigneeAvatar}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm">{ticket.assignedUsers.length > 0 ? `${ticket.assignedUsers.length} member${ticket.assignedUsers.length > 1 ? 's' : ''}` : "Unassigned"}</span>
                              {ticket.assignedUsers.length > 0 && (
                                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {ticket.assignedUserNames || ticket.assignee}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {ticket.slaDeadline 
                            ? new Date(ticket.slaDeadline).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Ticket Details Panel */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Ticket Details
                </CardTitle>
                {selectedTicket && (
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleEditTicket}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete ticket <strong>{selectedTicket.id}</strong>? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteTicket}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="details" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                  <TabsTrigger value="attachments">Files</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  {selectedTicket ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedTicket.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedTicket.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(selectedTicket.priority)}>
                        <div className="flex items-center gap-1">
                          {getPriorityIcon(selectedTicket.priority)}
                          {selectedTicket.priority}
                        </div>
                      </Badge>
                      {/* <Badge className={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status.replace('-', ' ')}
                      </Badge> */}
                      <Badge variant="outline">
                        <div className="flex items-center gap-1">
                          {getTypeIcon(selectedTicket.type)}
                          {selectedTicket.type}
                        </div>
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Assignee{selectedTicket.assignedUsers.length > 1 ? 's' : ''}:
                        </span>
                        {selectedTicket.assignedUsers.length > 0 ? (
                          <div className="space-y-2">
                            {selectedTicket.assignedUsers.map((user, index) => {
                              const firstName = user.FirstName || ""
                              const lastName = user.LastName || ""
                              const userName = `${firstName} ${lastName}`.trim() || "Unknown User"
                              const avatarInitials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "U"
                              
                              return (
                                <div 
                                  key={user.UserId || index} 
                                  className="flex items-center gap-3 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                                      {avatarInitials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{userName}</div>
                                    {user.Email && (
                                      <div className="text-xs text-muted-foreground">{user.Email}</div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs bg-muted text-muted-foreground">NA</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Reporter:</span>
                        <span>{selectedTicket.reporter}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(selectedTicket.created).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">SLA Deadline:</span>
                        <span className="text-warning">
                          {selectedTicket.slaDeadline 
                            ? new Date(selectedTicket.slaDeadline).toLocaleString()
                            : "N/A"}
                        </span>
                      </div>
                      
                      {/* <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Estimated Hours:</span>
                        <span>{selectedTicket.estimatedHours}h</span>
                      </div> */}
                    </div>
                    
                    {selectedTicket.linkedRules && selectedTicket.linkedRules.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Linked Rules</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedTicket.linkedRules.map(rule => (
                              <Badge key={rule} variant="outline" className="text-xs">
                                <Link className="w-3 h-3 mr-1" />
                                {rule}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedTicket.linkedExceptions && selectedTicket.linkedExceptions.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">Linked Exceptions</h4>
                          {selectedTicket.linkedExceptions.map(exceptionId => {
                            const exceptionDetails = getExceptionSummary(exceptionId)
                            return exceptionDetails ? (
                              <div key={exceptionId} className="border rounded-md p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-sm">{exceptionDetails.id}</span>
                                  <Badge className={
                                    exceptionDetails.severity === 'high' ? 'text-destructive bg-destructive/10 border-destructive/20' :
                                    exceptionDetails.severity === 'medium' ? 'text-warning bg-warning/10 border-warning/20' :
                                    'text-success bg-success/10 border-success/20'
                                  }>
                                    {exceptionDetails.severity}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  <div><strong>Type:</strong> {exceptionDetails.type}</div>
                                  <div><strong>Process:</strong> {exceptionDetails.process}</div>
                                  {/* <div><strong>Status:</strong> {exceptionDetails.status}</div> */}
                                </div>
                              </div>
                            ) : (
                              <Badge key={exceptionId} variant="outline" className="text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {exceptionId}
                              </Badge>
                            )
                          })}
                        </div>
                      </>
                    )}
                    
                    <Separator />
                    
                    {selectedTicket.tags && selectedTicket.tags.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedTicket.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    )}
                  </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Select a ticket to view details
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="messages" className="space-y-4">
                  {isLoadingChat ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : selectedTicket && chatMessages.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {chatMessages.map((chat) => {
                        // Get avatar initials from sender name
                        const senderName = chat.SendByName || "Unknown"
                        const nameParts = senderName.split(" ")
                        const avatarInitials = nameParts.length >= 2
                          ? `${nameParts[0][0] || ""}${nameParts[1][0] || ""}`.toUpperCase()
                          : (nameParts[0]?.[0] || "U").toUpperCase()
                        
                        return (
                          <div key={chat.ChatId} className="space-y-2">
                            <div className="flex gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">{avatarInitials}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <p className="text-sm text-foreground">{chat.Message}</p>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs text-muted-foreground">{chat.SendByName}</span>
                                  {chat.SendToName && (
                                    <>
                                      <span className="text-xs text-muted-foreground">→</span>
                                      <span className="text-xs text-muted-foreground">{chat.SendToName}</span>
                                    </>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(chat.CreatedAt).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Display replies if any */}
                            {chat.Replies && chat.Replies.length > 0 && (
                              <div className="ml-11 space-y-2 border-l-2 border-muted pl-4">
                                {chat.Replies.map((reply) => {
                                  // Replies use ReplySendByName/ReplySendToName, fallback to SendByName/SendToName
                                  const replyName = reply.ReplySendByName || reply.SendByName || "Unknown"
                                  const replyNameParts = replyName.split(" ")
                                  const replyAvatarInitials = replyNameParts.length >= 2
                                    ? `${replyNameParts[0][0] || ""}${replyNameParts[1][0] || ""}`.toUpperCase()
                                    : (replyNameParts[0]?.[0] || "U").toUpperCase()
                                  
                                  const replyToName = reply.ReplySendToName || reply.SendToName
                                  
                                  return (
                                    <div key={reply.ChatId} className="flex gap-3">
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback className="text-xs">{replyAvatarInitials}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 space-y-1">
                                        <p className="text-xs text-foreground">{reply.Message}</p>
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-xs text-muted-foreground">{replyName}</span>
                                          {replyToName && (
                                            <>
                                              <span className="text-xs text-muted-foreground">→</span>
                                              <span className="text-xs text-muted-foreground">{replyToName}</span>
                                            </>
                                          )}
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(reply.CreatedAt).toLocaleString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      {selectedTicket ? "No messages yet. Start the conversation below." : "Select a ticket to view messages"}
                    </div>
                  )}
                  
                  {selectedTicket && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select 
                        value={sendToUserId?.toString() || "all"} 
                        onValueChange={(value) => {
                          if (value === "all") {
                            setSendToUserId(null)
                          } else {
                            setSendToUserId(parseInt(value))
                          }
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Send to..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All (General Chat)</SelectItem>
                          {selectedTicket.assignedUsers && selectedTicket.assignedUsers.length > 0 && (
                            selectedTicket.assignedUsers.map((user) => (
                              <SelectItem key={user.UserId} value={user.UserId.toString()}>
                                {user.FirstName} {user.LastName}
                              </SelectItem>
                            ))
                          )}
                          {users.filter(u => 
                            !selectedTicket.assignedUsers.some(au => au.UserId === u.UserId)
                          ).map((user) => (
                            <SelectItem key={user.UserId} value={user.UserId.toString()}>
                              {user.FirstName} {user.LastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[60px] flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                      />
                    </div>
                    <div className="flex justify-between">
                      {/* <Button variant="outline" size="sm" disabled>
                        <Paperclip className="w-4 h-4 mr-2" />
                        Attach
                      </Button> */}
                      <Button 
                        size="sm" 
                        onClick={handleSendMessage} 
                        className="bg-gradient-primary"
                        disabled={isSendingMessage || !newMessage.trim()}
                      >
                        {isSendingMessage ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  )}
                </TabsContent>
                
                <TabsContent value="attachments" className="space-y-4">
                  {selectedTicket && selectedTicket.attachments && selectedTicket.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTicket.attachments.map((filePath, index) => {
                      // Get original filename (without timestamp prefix)
                      const originalFileName = getOriginalFileName(filePath)
                      // Truncate if too long
                      const displayFileName = truncateFileName(originalFileName, 40)
                      
                      // Handle download
                      const handleDownload = async () => {
                        try {
                          const token = localStorage.getItem('token')
                          if (!token) {
                            toast({
                              title: "Error",
                              description: "Authentication required to download file",
                              variant: "destructive"
                            })
                            return
                          }

                          // Construct download URL with path parameter
                          const downloadUrl = `${DOWNLOAD_ATTACHMENT_URL}?path=${encodeURIComponent(filePath)}`
                          
                          // Fetch with authentication
                          const response = await fetch(downloadUrl, {
                            method: 'GET',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                            }
                          })

                          if (!response.ok) {
                            throw new Error('Failed to download file')
                          }

                          // Get blob and create download link
                          const blob = await response.blob()
                          const url = window.URL.createObjectURL(blob)
                          const link = document.createElement('a')
                          link.href = url
                          link.download = originalFileName
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                          window.URL.revokeObjectURL(url)
                        } catch (error) {
                          console.error('Download error:', error)
                          toast({
                            title: "Error",
                            description: "Failed to download file",
                            variant: "destructive"
                          })
                        }
                      }
                      
                      return (
                        <div key={index} className="flex items-center justify-between gap-2 p-2 border border-border rounded-lg">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate" title={originalFileName}>
                              {displayFileName}
                            </span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-shrink-0"
                            onClick={handleDownload}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      {selectedTicket ? "No attachments yet." : "Select a ticket to view attachments"}
                    </div>
                  )}
                  
                  {selectedTicket && (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drop files here or <Button variant="link" className="p-0 h-auto">browse</Button>
                    </p>
                  </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Team Chat Panel (Collapsible) */}
        {showChatPanel && (
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Team Chat
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowChatPanel(false)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Chat List & Messages Area */}
                <div className="md:col-span-3 space-y-4">
                  <div className="border border-border rounded-lg overflow-hidden">
                    {/* Chat List Header */}
                    <div className="p-3 border-b border-border bg-muted/30">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Chat Conversations</h4>
                        <Select defaultValue="all">
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Chats</SelectItem>
                            <SelectItem value="unread">Unread</SelectItem>
                            <SelectItem value="with-attachments">With Attachments</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Chat List */}
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-1 p-2">
                        {/* Mock Chat Items - Replace with actual data from API */}
                        {users && users.length > 0 ? (
                          users.slice(0, 5).map((user) => {
                            const firstName = user.FirstName || ""
                            const lastName = user.LastName || ""
                            const userName = `${firstName} ${lastName}`.trim() || "Unknown User"
                            const avatarInitials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "U"
                            const hasAttachments = Math.random() > 0.5 // Mock: random for demo
                            const unreadCount = Math.floor(Math.random() * 5) // Mock: random unread count
                            const lastMessage = "This is a preview of the last message in this conversation..."
                            const lastMessageTime = "2 hours ago"
                            
                            return (
                              <div 
                                key={user.UserId}
                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border"
                              >
                                <Avatar className="w-10 h-10 flex-shrink-0">
                                  <AvatarFallback className="text-sm bg-primary/10 text-primary font-medium">
                                    {avatarInitials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold truncate">{userName}</span>
                                      {unreadCount > 0 && (
                                        <Badge variant="default" className="h-5 px-1.5 text-xs bg-primary">
                                          {unreadCount}
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                      {lastMessageTime}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground truncate flex-1">
                                      {lastMessage}
                                    </p>
                                    {hasAttachments && (
                                      <Paperclip className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                    )}
                                  </div>
                                  {hasAttachments && (
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <Badge variant="outline" className="text-xs h-5 px-1.5">
                                        <FileText className="w-3 h-3 mr-1" />
                                        document.pdf
                                      </Badge>
                                      <Badge variant="outline" className="text-xs h-5 px-1.5">
                                        <FileText className="w-3 h-3 mr-1" />
                                        image.png
                                      </Badge>
                                      {Math.random() > 0.7 && (
                                        <Badge variant="outline" className="text-xs h-5 px-1.5">
                                          +2 more
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-center text-sm text-muted-foreground py-8">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No conversations yet</p>
                            <p className="text-xs mt-1">Start a conversation with your team...</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  {/* Message Input */}
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Type a message..." 
                      className="flex-1" 
                    />
                    <Button size="sm" variant="outline" className="flex-shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button size="sm" className="bg-gradient-primary flex-shrink-0">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Team Members / Recipients List */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Team Members</h4>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {users && users.length > 0 ? (
                        users.map((user) => {
                          const firstName = user.FirstName || ""
                          const lastName = user.LastName || ""
                          const userName = `${firstName} ${lastName}`.trim() || "Unknown User"
                          const avatarInitials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "U"
                          
                          return (
                            <div 
                              key={user.UserId} 
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                                  {avatarInitials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{userName}</div>
                                <div className="text-xs text-muted-foreground truncate">{user.Email || ""}</div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center text-sm text-muted-foreground py-4">
                          No team members available
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}