import { useState, useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Bot, 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2,
  Sparkles,
  User,
  Zap,
  TrendingUp,
  Target,
  Users,
  Clock
} from "lucide-react"
import { AIService } from "@/services/AIService"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  suggestions?: string[]
}

export const FloatingAIAgent = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      type: 'ai',
      content: AIService.getWelcomeMessage(location.pathname),
      timestamp: new Date(),
      suggestions: AIService.getContextualSuggestions(location.pathname)
    }
    setMessages([welcomeMessage])
  }, [location.pathname])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle new message indicator
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      setHasNewMessage(true)
    }
  }, [messages, isOpen])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate AI thinking time
    setTimeout(async () => {
      const aiResponse = await AIService.getResponse(content, location.pathname)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.content,
        timestamp: new Date(),
        suggestions: aiResponse.suggestions
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500 + Math.random() * 1000) // Random delay for realism
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setHasNewMessage(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={toggleChat}
          className={cn(
            "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl z-50",
            "bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground",
            "transition-all duration-300 hover:scale-110 hover:shadow-glow",
            "flex items-center justify-center group"
          )}
        >
          <div className="relative">
            <Bot className="w-6 h-6 transition-transform group-hover:rotate-12" />
            {hasNewMessage && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
            )}
          </div>
          <Sparkles className="absolute w-4 h-4 -top-1 -right-1 text-warning animate-pulse" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "fixed bottom-6 right-6 z-50 shadow-2xl border-border bg-card",
          "transition-all duration-300",
          isMinimized ? "w-80 h-16" : "w-96 h-[600px]",
          "flex flex-col"
        )}>
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border bg-gradient-primary rounded-t-lg">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 bg-primary-foreground">
                <AvatarFallback className="bg-primary-foreground text-primary text-xs font-bold">
                  AI
                </AvatarFallback>
              </Avatar>
              <div className="text-primary-foreground">
                <CardTitle className="text-sm font-semibold">RPA Assistant</CardTitle>
                <div className="flex items-center gap-1 text-xs opacity-90">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  Online & Ready
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-8 h-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              {/* Messages */}
              <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={cn(
                        "flex gap-3",
                        message.type === 'user' ? "justify-end" : "justify-start"
                      )}>
                        {message.type === 'ai' && (
                          <Avatar className="w-7 h-7 mt-1 bg-gradient-primary flex-shrink-0">
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                              <Bot className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={cn(
                          "max-w-[280px] rounded-lg p-3 text-sm",
                          message.type === 'user' 
                            ? "bg-primary text-primary-foreground ml-auto" 
                            : "bg-muted"
                        )}>
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          <div className={cn(
                            "text-xs mt-1 opacity-70",
                            message.type === 'user' ? "text-right" : "text-left"
                          )}>
                            {formatTime(message.timestamp)}
                          </div>
                          
                          {message.suggestions && message.suggestions.length > 0 && (
                            <div className="mt-3 space-y-1">
                              <div className="text-xs opacity-70 mb-2">Try asking:</div>
                              {message.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 w-full justify-start"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>

                        {message.type === 'user' && (
                          <Avatar className="w-7 h-7 mt-1 bg-gradient-subtle flex-shrink-0">
                            <AvatarFallback className="bg-gradient-subtle text-foreground text-xs">
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex gap-3 justify-start">
                        <Avatar className="w-7 h-7 mt-1 bg-gradient-primary">
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask me about RPA processes, ROI, analytics..."
                      className="flex-1 text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage(inputValue)
                        }
                      }}
                      disabled={isTyping}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSendMessage(inputValue)}
                      disabled={isTyping || !inputValue.trim()}
                      className="px-3"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-1 mt-2">
                    <Badge 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-secondary/80"
                      onClick={() => handleSuggestionClick("Show me ROI metrics")}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      ROI
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-secondary/80"
                      onClick={() => handleSuggestionClick("What processes are running?")}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Status
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-secondary/80"
                      onClick={() => handleSuggestionClick("Show team performance")}
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Teams
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      )}
    </>
  )
}