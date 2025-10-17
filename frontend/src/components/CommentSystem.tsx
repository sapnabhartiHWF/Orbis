import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Paperclip,
  AtSign,
  Heart,
  Reply,
} from "lucide-react";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { toast } from "../hooks/use-toast";
import { extractMentions, getTimeAgo } from "../utils/collaborationUtils";
import { Popover, PopoverTrigger, PopoverContent } from "../components/ui/popover";

interface CommentSystemProps {
  processId?: string;
  fileId?: string;
  title?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  parentId?: string;
  mentions: string[];
  attachments: any[];
  reactions: { emoji: string; users: string[] }[];
  isEdited: boolean;
  replies?: Comment[];
}

interface User {
  id: number;
  name: string;
}

// ✅ Helper to decode JWT
function parseJwt(token: string) {
  try {
    const base64Payload = token.split(".")[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch (err) {
    console.error("Invalid token", err);
    return null;
  }
}

export function CommentSystem({ processId, fileId, title }: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const userUrl = "https://newsantova.onrender.com/api/users";
  const getcmtUrl = "https://newsantova.onrender.com/api/get-comments";
  const addcmtUrl = "https://newsantova.onrender.com/api/add-comment";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const token = localStorage.getItem("token");

  // ✅ Extract current user from JWT
  useEffect(() => {
    if (!token) {
      toast({
        title: "Login required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      window.location.href = "/login";
      return;
    }

    const payload = parseJwt(token);
    if (payload) {
      setCurrentUser({
        id: payload.UserId || payload.id,
        name:
          `${payload.FirstName || payload.firstName || ""} ${
            payload.LastName || payload.lastName || ""
          }`.trim() ||
          payload.username ||
          "Unknown User",
      });
    }
  }, [token]);

  // ✅ Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch(userUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      const fetchedUsers: User[] = Array.isArray(data.data)
        ? data.data.map((u: any) => ({
            id: u.UserId,
            name: `${u.FirstName} ${u.LastName}`.trim(),
          }))
        : [];
      setAllUsers(fetchedUsers);
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  // ✅ Fetch comments
  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(getcmtUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data = await response.json();

      const commentsArray = data.comments || (Array.isArray(data) ? data : []);
      const mappedComments: Comment[] = commentsArray.map((c: any) => ({
        id: `c${c.CommentID}`,
        content: c.CommentText || "",
        author: c.UserName || "Unknown",
        createdAt: new Date(c.CreatedDate || Date.now()).toISOString(),
        parentId: c.ParentID ? `c${c.ParentID}` : undefined,
        mentions: extractMentions(c.CommentText || ""),
        attachments: [],
        reactions: [],
        isEdited: false,
        replies: [],
      }));
      setComments(mappedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
      fetchUsers();
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  // ✅ Handle mentions
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleInput = () => {
      const value = textarea.value;
      const position = textarea.selectionStart;
      const textBeforeCursor = value.substring(0, position);
      const lastAtSymbol = textBeforeCursor.lastIndexOf("@");

      if (lastAtSymbol !== -1 && lastAtSymbol === position - 1) {
        setShowMentions(true);
        setMentionQuery("");
        setCursorPosition(position);
        if (allUsers.length === 0) fetchUsers();
      } else if (
        lastAtSymbol !== -1 &&
        textBeforeCursor.substring(lastAtSymbol + 1).indexOf(" ") === -1
      ) {
        const query = textBeforeCursor.substring(lastAtSymbol + 1);
        setMentionQuery(query);
        setShowMentions(true);
        setCursorPosition(position);
        const filtered = allUsers.filter((u) =>
          u.name.toLowerCase().includes(query.toLowerCase())
        );
        setUsers(filtered);
      } else {
        setShowMentions(false);
      }
    };

    textarea.addEventListener("input", handleInput);
    textarea.addEventListener("keyup", handleInput);
    return () => {
      textarea.removeEventListener("input", handleInput);
      textarea.removeEventListener("keyup", handleInput);
    };
  }, [allUsers]);

  const handleMentionSelect = (member: User) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const value = textarea.value;
    const lastAtSymbol = value.substring(0, cursorPosition).lastIndexOf("@");
    const beforeMention = value.substring(0, lastAtSymbol);
    const afterMention = value.substring(cursorPosition);
    const newValue = `${beforeMention}@${member.name} ${afterMention}`;
    setNewComment(newValue);
    setShowMentions(false);

    setTimeout(() => {
      textarea.focus();
      const newPos = beforeMention.length + member.name.length + 2;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // ✅ Submit comment
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    const mentions = extractMentions(newComment);
    const mentionedUserIDs = mentions
      .map(
        (m) =>
          allUsers.find((u) => u.name.toLowerCase().startsWith(m.toLowerCase()))
            ?.id
      )
      .filter(Boolean);

    const payload = {
      CommentText: newComment,
      ParentID: replyingTo ? parseInt(replyingTo.replace("c", "")) : null,
      MentionedUserIDs: mentionedUserIDs,
    };

    try {
      const response = await fetch(addcmtUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setNewComment("");
        setReplyingTo(null);
        toast({ title: "Comment posted!" });
        fetchComments();
      } else {
        toast({ title: "Error posting comment", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
  };

  // ✅ Reaction
  const handleReaction = (id: string, emoji: string) => {
    if (!currentUser) return;
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const existing = c.reactions.find((r) => r.emoji === emoji);
        if (existing) {
          existing.users = existing.users.includes(currentUser.name)
            ? existing.users.filter((u) => u !== currentUser.name)
            : [...existing.users, currentUser.name];
        } else {
          c.reactions.push({ emoji, users: [currentUser.name] });
        }
        return { ...c };
      })
    );
  };

  const commentTree = comments.reduce((tree: Record<string, Comment>, c) => {
    if (!c.parentId) tree[c.id] = { ...c, replies: [] };
    else if (tree[c.parentId]) tree[c.parentId].replies!.push(c);
    else tree[c.id] = { ...c, replies: [] };
    return tree;
  }, {} as Record<string, Comment>);

  const rootComments = Object.values(commentTree);

  if (loading || usersLoading || !currentUser) {
    return (
      <Card className="bg-card border-border shadow-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Discussion {title && <span className="text-muted-foreground">• {title}</span>}
        </CardTitle>
        <CardDescription>
          Collaborate with your team on this {processId ? "process" : "file"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ✅ Comment input */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Send className="w-4 h-4 text-blue-600" />
          </div>

          <div className="flex-1 space-y-2 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Add a comment... Use @username to mention team members"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-20 bg-muted border-border resize-none"
            />

            {/* Mentions dropdown */}
            {showMentions && users.length > 0 && (
              <Card className="absolute top-full left-0 mt-1 w-64 bg-popover border-border shadow-elevated z-50">
                <CardContent className="p-2">
                  {users.slice(0, 5).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                      onClick={() => handleMentionSelect(member)}
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm font-medium truncate">
                        {member.name}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Replying to */}
            {replyingTo && (
              <div className="ml-2 text-xs text-primary bg-primary/10 p-2 rounded-md">
                Replying to comment...
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-2 h-6 px-2"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel
                </Button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Paperclip className="w-3 h-3 mr-1" /> Attach
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setUsers(allUsers);
                    setShowMentions(true);
                    setMentionQuery("");
                  }}
                >
                  <AtSign className="w-3 h-3 mr-1" /> Mention
                </Button>
              </div>
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
              >
                <Send className="w-3 h-3 mr-1" /> Comment
              </Button>
            </div>
          </div>
        </div>

        {/* ✅ Comments list */}
        <div className="max-h-[500px] overflow-y-auto">
          {rootComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2" />
              No comments yet. Start the discussion!
            </div>
          ) : (
            rootComments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                handleReaction={handleReaction}
                currentUser={currentUser.name}
                setReplyingTo={setReplyingTo}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ✅ Comment Item (with emoji popover + reply button)
interface CommentItemProps {
  comment: Comment;
  handleReaction: (id: string, emoji: string) => void;
  currentUser: string;
  setReplyingTo?: (id: string | null) => void;
}

function CommentItem({
  comment,
  handleReaction,
  currentUser,
  setReplyingTo,
}: CommentItemProps) {
  const reactions = [
    { emoji: "👍", label: "Like" },
    { emoji: "❤️", label: "Love" },
    { emoji: "💡", label: "Insight" },
    { emoji: "🎯", label: "Goal" },
    { emoji: "🤔", label: "Think" },
    { emoji: "🎉", label: "Celebrate" },
  ];

  return (
    <div className="border-t pt-4 pl-4">
      <div className="flex items-start gap-2">
        <Avatar className="w-8 h-8">
          <AvatarFallback>{comment.author?.[0] || "?"}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="font-medium">{comment.author}</div>
          <div className="text-xs text-muted-foreground">
            {getTimeAgo(comment.createdAt)}
          </div>
          <p className="text-sm mt-1">{comment.content}</p>

          {/* ✅ Reactions + Reply */}
          <div className="flex items-center gap-2 mt-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 px-2">
                  <Heart className="w-3 h-3 mr-1" />
                  React
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 bg-popover border-border z-50">
                <div className="flex gap-1">
                  {reactions.map((r) => (
                    <Button
                      key={r.emoji}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-lg"
                      onClick={() => handleReaction(comment.id, r.emoji)}
                      title={r.label}
                    >
                      {r.emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {comment.reactions.map((r) => (
              <Button
                key={r.emoji}
                size="sm"
                variant={r.users.includes(currentUser) ? "default" : "secondary"}
                className="h-7 px-2 text-xs"
                onClick={() => handleReaction(comment.id, r.emoji)}
              >
                {r.emoji} {r.users.length}
              </Button>
            ))}

            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => setReplyingTo && setReplyingTo(comment.id)}
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
          </div>

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 ml-4 space-y-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  handleReaction={handleReaction}
                  currentUser={currentUser}
                  setReplyingTo={setReplyingTo}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
