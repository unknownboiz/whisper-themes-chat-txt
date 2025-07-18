import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  sender: string;
  content: string;
  created_at: string;
}

interface ChatAreaProps {
  currentUser: string;
  selectedUser: string;
}

export const ChatArea = ({ currentUser, selectedUser }: ChatAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [currentUser, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Get the recipient's user_id
      const { data: recipientProfile, error: recipientError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', selectedUser)
        .single();

      if (recipientError || !recipientProfile) return;

      // Load messages between current user and selected user
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          recipient_id
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientProfile.user_id}),and(sender_id.eq.${recipientProfile.user_id},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      // Get all user profiles for sender names
      const senderIds = [...new Set(messagesData?.map(msg => msg.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', senderIds);

      const profileMap = profiles?.reduce((acc, profile) => {
        acc[profile.user_id] = profile.username;
        return acc;
      }, {} as Record<string, string>) || {};

      const formattedMessages: Message[] = messagesData?.map(msg => ({
        id: msg.id,
        sender: profileMap[msg.sender_id] || 'Unknown',
        content: msg.content,
        created_at: msg.created_at
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Get the recipient's user_id
      const { data: recipientProfile, error: recipientError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', selectedUser)
        .single();

      if (recipientError || !recipientProfile) {
        console.error('Error finding recipient:', recipientError);
        return;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientProfile.user_id,
          content: newMessage.trim()
        })
        .select('id, content, created_at, sender_id')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      if (data) {
        const newMsg: Message = {
          id: data.id,
          sender: currentUser,
          content: data.content,
          created_at: data.created_at
        };

        setMessages(prev => [...prev, newMsg]);
        setNewMessage("");
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const shouldShowDateSeparator = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const prevDate = new Date(prevMsg.created_at).toDateString();
    return currentDate !== prevDate;
  };

  return (
    <div className="flex-1 bg-chat-bg flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-message-bg">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs">
              {selectedUser.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">{selectedUser}</h3>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const showDateSeparator = shouldShowDateSeparator(message, messages[index - 1]);
              const isOwnMessage = message.sender === currentUser;
              
              return (
                <div key={message.id} className="animate-message-in">
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                     <div className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                        {formatDate(message.created_at)}
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex gap-3 group hover:bg-message-hover p-2 rounded-lg transition-colors ${
                    isOwnMessage ? 'flex-row-reverse' : ''
                  }`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={`text-xs ${
                        isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
                      }`}>
                        {message.sender.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
                      <div className={`flex items-baseline gap-2 mb-1 ${
                        isOwnMessage ? 'flex-row-reverse' : ''
                      }`}>
                        <span className="font-medium text-foreground text-sm">
                          {message.sender}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                      
                      <div className={`inline-block max-w-md p-3 rounded-lg ${
                        isOwnMessage 
                          ? 'bg-primary text-primary-foreground ml-auto' 
                          : 'bg-message-bg text-foreground'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-message-bg">
        <div className="flex gap-2">
          <Input
            placeholder={`Message ${selectedUser}...`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-input border-border"
            maxLength={2000}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};