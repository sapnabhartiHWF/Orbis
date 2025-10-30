import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Paperclip,
  AtSign,
  Heart,
  Reply,
  MoreHorizontal,
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../components/ui/popover";

interface CommentSystemProps {
  processId?: string;
  fileId?: string;
  title?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  CreatedDate: string;
  parentId?: string;
  mentions: string[];
  attachments: any[];
  isEdited: boolean;
  replies?: Comment[];
  reactions: { emoji: string; count: number }[]; // ✅ simplified
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

const aggregateReactions = (reactions: any[]) =>
  reactions.map((r) => ({ emoji: r.EmojiName, count: r.ReactionCount }));

export function CommentSystem({
  processId,
  fileId,
  title,
}: CommentSystemProps) {
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
  const [emojis, setEmojis] = useState([]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const mentionRef = useRef<HTMLDivElement>(null);

  const userUrl = "https://orbis-backend-usfo.onrender.com/api/users";
  const getcmtUrl = "https://orbis-backend-usfo.onrender.com/api/get-comments";
  const addcmtUrl = "https://orbis-backend-usfo.onrender.com/api/add-comment";
  const reactCommentUrl = "https://orbis-backend-usfo.onrender.com/api/react-comment";
  const getAllReact = "https://orbis-backend-usfo.onrender.com/api/get-all-reacts";
  const deleteReactUrl = "https://orbis-backend-usfo.onrender.com/api/delete-reaction";

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
        id: payload.UserId || payload.userId || payload.id,
        name:
          `${payload.FirstName || ""} ${payload.LastName || ""}`.trim() ||
          payload.UserName ||
          "Unknown User",
      });
    }
  }, [token]);

  useEffect(() => {
    const fetchEmojis = async () => {
      try {
        const response = await fetch(getAllReact, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch emojis");
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setEmojis(data.data); // [{ R_Id, EmojiName }]
        }
      } catch (err) {
        console.error("Error fetching emojis:", err);
      }
    };

    fetchEmojis();
  }, []);

  const fetchUsers = async () => {
    setUsersLoading(true); // ensure starts
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
      setUsersLoading(false); // ✅ ensures it ends
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const refresh = () => fetchComments();
    window.addEventListener("refreshComments", refresh);
    return () => window.removeEventListener("refreshComments", refresh);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mentionRef.current &&
        !mentionRef.current.contains(event.target as Node)
      ) {
        setShowMentions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Fetch comments
  const fetchComments = async () => {
    setLoading(true); // ensure starts in loading
    try {
      const response = await fetch(getcmtUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const mapped = data.data
          .map((c: any) => ({
            id: `c${c.CommentID}`,
            content: c.CommentText,
            author: c.UserName,
            CreatedDate: c.CreatedDate,
            parentId: c.ParentID ? `c${c.ParentID}` : undefined,
            mentions: c.MentionedUsersInfo || [],
            attachments: [],
            isEdited: false,
            reactions: aggregateReactions(c.Reactions || []),
          }))
          .sort(
            (a, b) =>
              new Date(b.CreatedDate).getTime() -
              new Date(a.CreatedDate).getTime()
          );
        setComments(mapped);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false); // ✅ ensures it ends
    }
  };

  // ✅ Now useEffect just *calls* it
  useEffect(() => {
    fetchComments();
  }, [token]);

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
  // ✅ Handle emoji reaction and sync with backend
  // const handleReaction = async (commentId: string, emoji: string) => {
  //   if (!currentUser || !token) return;

  //   try {
  //     const selectedEmoji = emojis.find((e) => e.EmojiName === emoji);
  //     if (!selectedEmoji) return;

  //     const payload = {
  //       CommentID: parseInt(commentId.replace("c", "")),
  //       R_Id: selectedEmoji.R_Id,
  //     };

  //     const response = await fetch(reactCommentUrl, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify(payload),
  //     });

  //     const data = await response.json();

  //     if (data.success) {
  //       // ✅ Update comment reactions using existing count
  //       setComments((prev) =>
  //         prev.map((c) => {
  //           if (c.id === commentId) {
  //             const existing = c.reactions.find((r) => r.emoji === emoji);
  //             if (existing) existing.count += 1;
  //             else c.reactions.push({ emoji, count: 1 });
  //           }
  //           return { ...c };
  //         })
  //       );
  //     } else {
  //       toast({ title: "Failed to react", variant: "destructive" });
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  const handleReaction = async (commentId: string, emoji: string) => {
    if (!currentUser || !token) return;

    const selectedEmoji = emojis.find((e) => e.EmojiName === emoji);
    if (!selectedEmoji) return;

    const numericCommentId = parseInt(commentId.replace("c", ""));
    const r_id = selectedEmoji.R_Id;
    const user_id = currentUser.id; // ✅ fixed

    try {
      // Step 1: Try to delete reaction (toggle off)
      const delResponse = await fetch(deleteReactUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          CommentID: numericCommentId,
          R_Id: r_id,
          UserID: user_id, // ✅ fixed
        }),
      });

      const delData = await delResponse.json();

      if (delResponse.ok && delData.success) {
        // ✅ Successfully removed reaction
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              const updatedReactions = c.reactions
                .map((r) =>
                  r.emoji === emoji ? { ...r, count: r.count - 1 } : r
                )
                .filter((r) => r.count > 0);
              return { ...c, reactions: updatedReactions };
            }
            return c;
          })
        );
        return;
      }

      // Step 2: If no matching reaction, add it
      if (delData.message?.includes("No matching reaction")) {
        const addResponse = await fetch(reactCommentUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            CommentID: numericCommentId,
            R_Id: r_id,
            UserID: user_id, // ✅ fixed
          }),
        });

        const addData = await addResponse.json();

        if (addResponse.ok && addData.success) {
          setComments((prev) =>
            prev.map((c) => {
              if (c.id === commentId) {
                const existing = c.reactions.find((r) => r.emoji === emoji);
                if (existing) existing.count += 1;
                else c.reactions.push({ emoji, count: 1 });
              }
              return { ...c };
            })
          );
        } else {
          toast({ title: "Failed to react", variant: "destructive" });
        }
      }
    } catch (err) {
      console.error("Error toggling reaction:", err);
    }
  };

  // ✅ Build full threaded comment tree safely (order-independent)
  const buildCommentTree = (flatComments: Comment[]) => {
    const map: Record<string, Comment> = {};
    const roots: Comment[] = [];

    // First pass: initialize map
    flatComments.forEach((c) => {
      map[c.id] = { ...c, replies: [] };
    });

    // Second pass: attach children
    flatComments.forEach((c) => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].replies!.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });

    return roots;
  };

  // Then replace your previous section with:
  const rootComments = buildCommentTree(comments);

  console.log({
    loading,
    usersLoading,
    currentUser,
    token,
  });

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
          Discussion{" "}
          {title && <span className="text-muted-foreground">• {title}</span>}
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

          <div ref={mentionRef}  className="flex-1 space-y-2 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Add a comment... Use @username to mention team members"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-20 bg-muted border-border resize-none"
            />

            {/* Mentions dropdown */}
            {/* {showMentions && users.length > 0 && (
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
            )} */}
            {showMentions && users.length > 0 && (
              <Card className="absolute top-full left-0 mt-1 w-64 bg-popover border-border shadow-elevated z-50 max-h-48 overflow-y-auto hide-scrollbar">
                <CardContent className="p-2">
                  {users.map((member) => (
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
                emojis={emojis}
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
  emojis: { R_Id: number; EmojiName: string }[];
}

function CommentItem({
  comment,
  handleReaction,
  currentUser,
  setReplyingTo,
  emojis,
}: CommentItemProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false); // track reply box
  const [replyText, setReplyText] = useState(""); // reply content

  const reactions = emojis.map((e) => ({
    emoji: e.EmojiName,
    label: e.EmojiName,
  }));

  const handleEmojiClick = (emoji: string) => {
    handleReaction(comment.id, emoji);
    setIsPopoverOpen(false);
  };

  // const handleReplySubmit = () => {
  //   if (!replyText.trim() || !setReplyingTo) return;
  //   setReplyingTo(comment.id); // set parent
  //   const event = new Event("submitReply"); // simple trigger
  //   document.dispatchEvent(event);
  //   setReplyText(""); // clear input
  //   setShowReplyBox(false);
  // };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const payload = {
        CommentText: replyText,
        ParentID: parseInt(comment.id.replace("c", "")), // ✅ numeric parent id
        MentionedUserIDs: [],
      };

      const response = await fetch("https://orbis-backend-usfo.onrender.com/api/add-comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: "Reply added!" });
        setReplyText("");
        setShowReplyBox(false);
        window.dispatchEvent(new Event("refreshComments")); // ✅ refresh
      } else {
        toast({ title: "Error posting reply", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Network error", variant: "destructive" });
    }
  };

  return (
    <div className="mt-4 border-t pt-4 pl-4">
      <div className="flex items-start gap-2">
        <Avatar className="w-8 h-8 bg-blue-100 border border-border flex items-center justify-center">
          <AvatarFallback className="text-blue-700 font-medium">
            {comment.author?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="font-medium">{comment.author}</div>
          <div className="text-xs text-muted-foreground">
            {getTimeAgo(comment.CreatedDate)}
          </div>

          <p className="text-sm mt-1">{comment.content}</p>

          <div className="flex items-center gap-2 mt-2">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 px-2">
                  React
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 bg-popover border-border z-50">
                <div className="flex gap-1">
                  {reactions.map((r) => (
                    <Button
                      key={`${comment.id}-popover-${r.emoji}`}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-lg"
                      onClick={() => handleEmojiClick(r.emoji)}
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
                key={`${comment.id}-${r.emoji}`}
                size="sm"
                variant="secondary"
                className="h-7 px-2 text-xs"
                onClick={() => handleReaction(comment.id, r.emoji)} // ← Make reaction button clickable
              >
                {r.emoji} {r.count}
              </Button>
            ))}

            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => setShowReplyBox((prev) => !prev)}
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
          </div>

          {/* ✅ Inline Reply Box */}
          {showReplyBox && (
            <div className="mt-2 ml-10 flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Send className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-center w-full gap-2">
                {/* Textarea (takes full width) */}
                <Textarea
                  placeholder={`Reply to ${comment.author}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 h-10 min-h-0 p-1 px-3 bg-muted border-border resize-none"
                />

                {/* Buttons aligned to the right */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleReplySubmit}
                    disabled={!replyText.trim()}
                  >
                    Reply
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowReplyBox(false);
                      setReplyText("");
                    }}
                  >
                    Cancel
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 px-2">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-32 p-2 bg-popover border-border z-50">
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="justify-start"
                        >
                          <Paperclip className="w-3 h-3 mr-2" /> Attach
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="justify-start"
                        >
                          <AtSign className="w-3 h-3 mr-2" /> Mention
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

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
                  emojis={emojis}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
