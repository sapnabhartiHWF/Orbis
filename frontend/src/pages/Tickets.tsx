import { useState } from "react"
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
  Flag
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { getExceptionSummary } from "@/utils/ticketExceptionIntegration"

// Mock ticket data
const mockTickets = [
  {
    id: "TKT-001",
    title: "Invoice validation rule causing timeouts",
    type: "Error",
    priority: "high",
    status: "open",
    assignee: "Sarah Chen",
    assigneeAvatar: "SC",
    reporter: "Mike Johnson",
    created: "2024-01-15 09:30:00",
    updated: "2024-01-15 14:22:00",
    slaDeadline: "2024-01-16 09:30:00",
    description: "The new invoice validation rule is causing system timeouts during peak hours. Multiple processes are affected.",
    linkedRules: ["RULE-001", "RULE-003"],
    linkedExceptions: ["EXC-001", "EXC-004"],
    attachments: ["error_logs.zip", "process_screenshot.png"],
    tags: ["validation", "performance", "critical"],
    estimatedHours: 8,
    messages: [
      {
        id: 1,
        author: "Mike Johnson",
        avatar: "MJ",
        timestamp: "2024-01-15 09:35:00",
        message: "I've noticed this issue started after the rule update yesterday. The validation is taking too long on large invoices."
      },
      {
        id: 2,
        author: "Sarah Chen",
        avatar: "SC", 
        timestamp: "2024-01-15 10:15:00",
        message: "Thanks for reporting. I'm investigating the rule logic now. Can you share the specific invoice formats that are causing issues?"
      },
      {
        id: 3,
        author: "Mike Johnson",
        avatar: "MJ",
        timestamp: "2024-01-15 14:22:00",
        message: "Uploaded the error logs and a screenshot showing the timeout. The issue mainly occurs with invoices over $50k."
      }
    ]
  },
  {
    id: "TKT-002",
    title: "Add multi-currency support to expense processing",
    type: "New Process",
    priority: "medium",
    status: "in-progress",
    assignee: "David Liu",
    assigneeAvatar: "DL",
    reporter: "Anna Smith",
    created: "2024-01-14 11:20:00",
    updated: "2024-01-15 16:45:00",
    slaDeadline: "2024-01-21 11:20:00",
    description: "Request to automate expense processing for multiple currencies including EUR, GBP, and JPY.",
    linkedRules: [],
    linkedExceptions: [],
    attachments: ["currency_requirements.pdf", "sample_expenses.xlsx"],
    tags: ["enhancement", "internationalization", "finance"],
    estimatedHours: 40,
    messages: [
      {
        id: 1,
        author: "Anna Smith",
        avatar: "AS",
        timestamp: "2024-01-14 11:25:00",
        message: "We're expanding operations to Europe and Japan. Need automated processing for local currency expenses."
      },
      {
        id: 2,
        author: "David Liu",
        avatar: "DL",
        timestamp: "2024-01-14 15:30:00",
        message: "I've reviewed the requirements. We'll need to integrate with currency conversion APIs and update validation rules."
      }
    ]
  },
  {
    id: "TKT-003",
    title: "Improve error messaging in customer onboarding",
    type: "Feedback",
    priority: "low",
    status: "resolved",
    assignee: "Emma Wilson",
    assigneeAvatar: "EW",
    reporter: "Tom Brown",
    created: "2024-01-12 14:15:00", 
    updated: "2024-01-15 10:30:00",
    slaDeadline: "2024-01-19 14:15:00",
    description: "Current error messages in the onboarding process are too technical for end users.",
    linkedRules: ["RULE-002"],
    linkedExceptions: ["EXC-002"],
    attachments: ["user_feedback.pdf"],
    tags: ["ux", "onboarding", "messaging"],
    estimatedHours: 4,
    messages: [
      {
        id: 1,
        author: "Tom Brown", 
        avatar: "TB",
        timestamp: "2024-01-12 14:20:00",
        message: "Users are confused by technical error codes. We need more user-friendly messages."
      },
      {
        id: 2,
        author: "Emma Wilson",
        avatar: "EW",
        timestamp: "2024-01-13 09:00:00",
        message: "Good point. I'll update the error handling to show clearer messages and guidance for next steps."
      },
      {
        id: 3,
        author: "Emma Wilson",
        avatar: "EW",
        timestamp: "2024-01-15 10:30:00",
        message: "Completed the update. Error messages now include plain language explanations and suggested actions."
      }
    ]
  }
]

// Mock team members for chat
const teamMembers = [
  { id: 1, name: "Sarah Chen", role: "RPA Developer", avatar: "SC", status: "online" },
  { id: 2, name: "David Liu", role: "Solution Architect", avatar: "DL", status: "online" },
  { id: 3, name: "Emma Wilson", role: "Business Analyst", avatar: "EW", status: "away" },
  { id: 4, name: "Mike Johnson", role: "Process Owner", avatar: "MJ", status: "offline" }
]

export default function Tickets() {
  const [selectedTicket, setSelectedTicket] = useState(mockTickets[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [newMessage, setNewMessage] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showChatPanel, setShowChatPanel] = useState(false)
  const { toast } = useToast()

  const filteredTickets = mockTickets.filter(ticket => {
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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      toast({
        title: "Message sent",
        description: "Your message has been added to the ticket thread."
      })
      setNewMessage("")
    }
  }

  const handleCreateTicket = () => {
    toast({
      title: "Ticket created",
      description: "New ticket has been created and assigned."
    })
    setShowCreateDialog(false)
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
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="new-process">New Process</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select>
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
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" placeholder="Brief description of the issue or request" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Detailed description..."
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Attachments</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Drop files here or <Button variant="link" className="p-0 h-auto">browse</Button>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTicket} className="bg-gradient-primary">
                      Create Ticket
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
                  <p className="text-2xl font-bold">34</p>
                  <p className="text-xs text-warning">5 high priority</p>
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
                  <p className="text-2xl font-bold text-warning">12</p>
                  <p className="text-xs text-success">+3 this week</p>
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
                  <p className="text-2xl font-bold text-success">2.1d</p>
                  <p className="text-xs text-success">-0.3d improvement</p>
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
                  <p className="text-2xl font-bold text-primary">8</p>
                  <p className="text-xs text-muted-foreground">of 12 members</p>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>SLA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow 
                        key={ticket.id}
                        className={`cursor-pointer transition-colors ${
                          selectedTicket.id === ticket.id 
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
                        <TableCell>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">{ticket.assigneeAvatar}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{ticket.assignee}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(ticket.slaDeadline).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                <Button size="sm" variant="outline">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
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
                      <Badge className={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status.replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        <div className="flex items-center gap-1">
                          {getTypeIcon(selectedTicket.type)}
                          {selectedTicket.type}
                        </div>
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Assignee:</span>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-xs">{selectedTicket.assigneeAvatar}</AvatarFallback>
                          </Avatar>
                          <span>{selectedTicket.assignee}</span>
                        </div>
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
                        <span className="text-warning">{new Date(selectedTicket.slaDeadline).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Estimated Hours:</span>
                        <span>{selectedTicket.estimatedHours}h</span>
                      </div>
                    </div>
                    
                    {selectedTicket.linkedRules.length > 0 && (
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
                    
                    {selectedTicket.linkedExceptions.length > 0 && (
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
                                  <div><strong>Status:</strong> {exceptionDetails.status}</div>
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
                  </div>
                </TabsContent>
                
                <TabsContent value="messages" className="space-y-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {selectedTicket.messages.map((message) => (
                        <div key={message.id} className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">{message.avatar}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{message.author}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{message.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="flex justify-between">
                      <Button variant="outline" size="sm">
                        <Paperclip className="w-4 h-4 mr-2" />
                        Attach
                      </Button>
                      <Button size="sm" onClick={handleSendMessage} className="bg-gradient-primary">
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="attachments" className="space-y-4">
                  <div className="space-y-2">
                    {selectedTicket.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border border-border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{file}</span>
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drop files here or <Button variant="link" className="p-0 h-auto">browse</Button>
                    </p>
                  </div>
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
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setShowChatPanel(false)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Team Members */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Team Members</h4>
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">{member.avatar}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                            member.status === 'online' ? 'bg-success' :
                            member.status === 'away' ? 'bg-warning' : 'bg-muted-foreground'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Chat Area */}
                <div className="md:col-span-3 space-y-4">
                  <div className="h-[200px] border border-border rounded-lg p-4 bg-muted/10">
                    <div className="text-center text-sm text-muted-foreground">
                      Start a conversation with your team...
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input placeholder="Type a message..." className="flex-1" />
                    <Button size="sm" className="bg-gradient-primary">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}