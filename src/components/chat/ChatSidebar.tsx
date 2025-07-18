import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, LogOut, Moon, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChatSidebarProps {
  currentUser: string;
  selectedUser: string | null;
  onSelectUser: (username: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const ChatSidebar = ({ 
  currentUser, 
  selectedUser, 
  onSelectUser, 
  onLogout,
  isDarkMode,
  onToggleTheme 
}: ChatSidebarProps) => {
  const [users, setUsers] = useState<string[]>([]);
  const [newUserSearch, setNewUserSearch] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('contact_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading contacts:', error);
        return;
      }

      if (!contacts || contacts.length === 0) {
        setUsers([]);
        return;
      }

      // Get usernames for all contacts
      const contactIds = contacts.map(contact => contact.contact_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('username')
        .in('user_id', contactIds);

      const usernames = profiles?.map(profile => profile.username).filter(Boolean) || [];
      setUsers(usernames);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddUser = async () => {
    if (!newUserSearch.trim()) return;
    
    if (newUserSearch === currentUser) {
      toast({
        title: "Error", 
        description: "You can't add yourself",
        variant: "destructive"
      });
      return;
    }

    if (users.includes(newUserSearch)) {
      toast({
        title: "Error",
        description: "User already in your contacts",
        variant: "destructive"
      });
      return;
    }

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Check if the username exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', newUserSearch)
        .single();

      if (profileError || !profile) {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive"
        });
        return;
      }

      // Add to contacts
      const { error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          contact_id: profile.user_id
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add contact",
          variant: "destructive"
        });
        return;
      }

      const updatedUsers = [...users, newUserSearch];
      setUsers(updatedUsers);
      setNewUserSearch("");
      setShowAddUser(false);
      toast({
        title: "Success",
        description: `Added ${newUserSearch} to your contacts`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive"
      });
    }
  };

  const getUnreadCount = (username: string) => {
    // Simplified for this implementation
    // In a real app, you'd track read status properly
    return 0;
  };

  return (
    <div className="w-60 bg-sidebar-bg border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Discord Clone</h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleTheme}
              className="h-8 w-8 p-0"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {currentUser.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">{currentUser}</span>
        </div>
      </div>

      {/* Add User Section */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Direct Messages</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 ml-auto"
            onClick={() => setShowAddUser(!showAddUser)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        {showAddUser && (
          <div className="flex gap-2">
            <Input
              placeholder="Find user..."
              value={newUserSearch}
              onChange={(e) => setNewUserSearch(e.target.value)}
              className="text-xs h-8"
              onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
            />
            <Button size="sm" onClick={handleAddUser} className="h-8 px-2">
              Add
            </Button>
          </div>
        )}
      </div>

      {/* Users List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No users added yet
            </div>
          ) : (
            users.map((username) => {
              const unreadCount = getUnreadCount(username);
              return (
                <Button
                  key={username}
                  variant="ghost"
                  className={`w-full justify-start h-auto p-2 ${
                    selectedUser === username ? 'bg-sidebar-active' : 'hover:bg-message-hover'
                  }`}
                  onClick={() => onSelectUser(username)}
                >
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                      {username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{username}</span>
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};