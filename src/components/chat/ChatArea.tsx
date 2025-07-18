import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
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

  const chatKey = `discord_messages_${[currentUser, selectedUser].sort().join('_')}`;

  useEffect(() => {
    const loadMessages = () => {
      const savedMessages = localStorage.getItem(chatKey);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([]);
      }
    };

    loadMessages();
    
    // Mark messages as read
    localStorage.setItem(`discord_lastread_${currentUser}_${selectedUser}`, Date.now().toString());
  }, [currentUser, selectedUser, chatKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveMessages = (updatedMessages: Message[]) => {
    localStorage.setItem(chatKey, JSON.stringify(updatedMessages));
    
    // Also save to individual txt-like format for backup
    const txtContent = updatedMessages.map(msg => 
      `[${new Date(msg.timestamp).toLocaleString()}] ${msg.sender}: ${msg.content}`
    ).join('\n');
    localStorage.setItem(`${chatKey}_txt`, txtContent);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: currentUser,
      content: newMessage.trim(),
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
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
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const prevDate = new Date(prevMsg.timestamp).toDateString();
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
                        {formatDate(message.timestamp)}
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
                          {formatTime(message.timestamp)}
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