import { useState } from "react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { MoreHorizontal, Calendar, Users, TrendingUp, Clock, Target, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface KanbanItem {
  id: string
  title: string
  description: string
  priority: "Low" | "Medium" | "High" | "Critical"
  assignee: { name: string; avatar?: string }
  dueDate: string
  estimatedROI: number
  progress: number
  tags: string[]
  department: string
}

interface Column {
  id: string
  title: string
  color: string
  items: KanbanItem[]
}

const initialData: Column[] = [
  {
    id: "submitted",
    title: "Submitted",
    color: "border-blue-500/50 bg-blue-500/5",
    items: [
      {
        id: "item-1",
        title: "Expense Report Automation",
        description: "Automate expense report validation and approval routing",
        priority: "Medium",
        assignee: { name: "David Park", avatar: "/api/placeholder/32/32" },
        dueDate: "2024-02-15",
        estimatedROI: 95000,
        progress: 0,
        tags: ["Finance", "OCR", "Mobile"],
        department: "Finance"
      },
      {
        id: "item-2", 
        title: "Contract Management System",
        description: "Automated contract lifecycle management with AI review",
        priority: "High",
        assignee: { name: "James Miller", avatar: "/api/placeholder/32/32" },
        dueDate: "2024-03-01",
        estimatedROI: 280000,
        progress: 0,
        tags: ["Legal", "AI", "Compliance"],
        department: "Legal"
      }
    ]
  },
  {
    id: "review",
    title: "Under Review",
    color: "border-warning/50 bg-warning/5",
    items: [
      {
        id: "item-3",
        title: "Employee Onboarding Bot",
        description: "Streamline new hire onboarding with document collection automation",
        priority: "Medium",
        assignee: { name: "Michael Rodriguez", avatar: "/api/placeholder/32/32" },
        dueDate: "2024-02-28",
        estimatedROI: 180000,
        progress: 25,
        tags: ["HR", "Onboarding", "Documents"],
        department: "HR"
      },
      {
        id: "item-4",
        title: "Inventory Optimization",
        description: "AI-powered inventory management and demand forecasting",
        priority: "Critical",
        assignee: { name: "Sarah Chen", avatar: "/api/placeholder/32/32" },
        dueDate: "2024-03-15",
        estimatedROI: 450000,
        progress: 15,
        tags: ["Operations", "AI", "Inventory"],
        department: "Operations"
      }
    ]
  },
  {
    id: "development",
    title: "In Development",
    color: "border-primary/50 bg-primary/5",
    items: [
      {
        id: "item-5",
        title: "Invoice Processing Automation",
        description: "End-to-end invoice processing with OCR and approval workflows",
        priority: "High",
        assignee: { name: "Sarah Chen", avatar: "/api/placeholder/32/32" },
        dueDate: "2024-03-30",
        estimatedROI: 340000,
        progress: 65,
        tags: ["Finance", "OCR", "Workflow"],
        department: "Finance"
      },
      {
        id: "item-6",
        title: "IT Ticket Auto-Assignment",
        description: "Intelligent routing of IT support tickets using NLP",
        priority: "High",
        assignee: { name: "Lisa Wang", avatar: "/api/placeholder/32/32" },
        dueDate: "2024-02-20",
        estimatedROI: 280000,
        progress: 80,
        tags: ["IT", "NLP", "Support"],
        department: "IT"
      }
    ]
  },
  {
    id: "testing",
    title: "Testing",
    color: "border-secondary/50 bg-secondary/5",
    items: [
      {
        id: "item-7",
        title: "Customer Service Chatbot",
        description: "AI-powered customer service automation with sentiment analysis",
        priority: "High",
        assignee: { name: "Emma Thompson", avatar: "/api/placeholder/32/32" },
        dueDate: "2024-02-10",
        estimatedROI: 520000,
        progress: 90,
        tags: ["Customer Service", "AI", "Chatbot"],
        department: "Customer Service"
      }
    ]
  },
  {
    id: "deployed",
    title: "Deployed",
    color: "border-success/50 bg-success/5",
    items: [
      {
        id: "item-8",
        title: "Customer Data Reconciliation",
        description: "Automated cross-system data validation and reconciliation",
        priority: "Critical",
        assignee: { name: "Emma Thompson", avatar: "/api/placeholder/32/32" },
        dueDate: "2024-01-15",
        estimatedROI: 520000,
        progress: 100,
        tags: ["Data Quality", "CRM", "Reconciliation"],
        department: "Operations"
      }
    ]
  }
]

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Low": return "bg-muted text-muted-foreground"
    case "Medium": return "bg-blue-500/20 text-blue-400"
    case "High": return "bg-warning/20 text-warning-foreground"
    case "Critical": return "bg-destructive/20 text-destructive-foreground"
    default: return "bg-muted text-muted-foreground"
  }
}

function KanbanCard({ item }: { item: KanbanItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const daysUntilDue = Math.ceil((new Date(item.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = daysUntilDue < 0
  const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing bg-card border-border shadow-card hover:shadow-elevated transition-all duration-300 ${
        isDragging ? "opacity-50 shadow-2xl" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-semibold line-clamp-2">{item.title}</CardTitle>
            <CardDescription className="text-xs mt-1 line-clamp-2">{item.description}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getPriorityColor(item.priority)}>
            {item.priority}
          </Badge>
          <Badge variant="outline">{item.department}</Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Progress */}
        {item.progress > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{item.progress}%</span>
            </div>
            <Progress value={item.progress} className="h-1.5" />
          </div>
        )}

        {/* ROI */}
        <div className="flex items-center gap-2 text-xs">
          <TrendingUp className="w-3 h-3 text-success" />
          <span className="font-medium text-success">ROI: ${(item.estimatedROI / 1000).toFixed(0)}K</span>
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-3 h-3 text-muted-foreground" />
          <span className={`
            ${isOverdue ? 'text-destructive font-medium' : ''}
            ${isDueSoon ? 'text-warning font-medium' : ''}
            ${!isOverdue && !isDueSoon ? 'text-muted-foreground' : ''}
          `}>
            Due {new Date(item.dueDate).toLocaleDateString()}
          </span>
          {isOverdue && <AlertCircle className="w-3 h-3 text-destructive" />}
          {isDueSoon && <Clock className="w-3 h-3 text-warning" />}
        </div>

        {/* Assignee */}
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={item.assignee.avatar} />
            <AvatarFallback className="text-xs">
              {item.assignee.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{item.assignee.name}</span>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1 flex-wrap">
          {item.tags.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {item.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{item.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function KanbanColumn({ column }: { column: Column }) {
  return (
    <div className="flex flex-col min-h-[600px] w-80">
      <div className={`p-4 rounded-t-lg border-t border-l border-r ${column.color}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{column.title}</h3>
          <Badge variant="secondary">{column.items.length}</Badge>
        </div>
      </div>
      
      <div className={`flex-1 p-4 border-l border-r border-b ${column.color} rounded-b-lg`}>
        <SortableContext items={column.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {column.items.map((item) => (
              <KanbanCard key={item.id} item={item} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

export function PipelineKanban() {
  const [columns, setColumns] = useState<Column[]>(initialData)
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const item = columns.flatMap(col => col.items).find(item => item.id === active.id)
    setActiveItem(item || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over) return

    // Find source and target columns
    const sourceColumn = columns.find(col => col.items.some(item => item.id === active.id))
    const targetColumn = columns.find(col => 
      col.id === over.id || col.items.some(item => item.id === over.id)
    )

    if (!sourceColumn || !targetColumn) return

    // If dropping on a different column
    if (sourceColumn.id !== targetColumn.id) {
      const item = sourceColumn.items.find(item => item.id === active.id)
      if (!item) return

      setColumns(prev => prev.map(col => {
        if (col.id === sourceColumn.id) {
          return {
            ...col,
            items: col.items.filter(item => item.id !== active.id)
          }
        }
        if (col.id === targetColumn.id) {
          return {
            ...col,
            items: [...col.items, item]
          }
        }
        return col
      }))
    }
  }

  const totalItems = columns.reduce((sum, col) => sum + col.items.length, 0)
  const totalROI = columns.flatMap(col => col.items).reduce((sum, item) => sum + item.estimatedROI, 0)
  const inProgressItems = columns.find(col => col.id === 'development')?.items.length || 0
  const completedItems = columns.find(col => col.id === 'deployed')?.items.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
          <Target className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Pipeline Kanban Board</h2>
          <p className="text-muted-foreground">Visual process pipeline management</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary border-primary/30 shadow-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Total ROI</p>
                <p className="text-xl font-bold text-primary-foreground">
                  ${(totalROI / 1000000).toFixed(1)}M
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning border-warning/30 shadow-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-foreground/80 text-sm font-medium">In Progress</p>
                <p className="text-xl font-bold text-warning-foreground">{inProgressItems}</p>
              </div>
              <Clock className="w-6 h-6 text-warning-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success border-success/30 shadow-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/80 text-sm font-medium">Completed</p>
                <p className="text-xl font-bold text-success-foreground">{completedItems}</p>
              </div>
              <Target className="w-6 h-6 text-success-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Items</p>
                <p className="text-xl font-bold text-foreground">{totalItems}</p>
              </div>
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6">
          {columns.map((column) => (
            <KanbanColumn key={column.id} column={column} />
          ))}
        </div>
        
        <DragOverlay>
          {activeItem ? <KanbanCard item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}