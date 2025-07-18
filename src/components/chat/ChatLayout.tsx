import { useState, useEffect } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatArea } from "./ChatArea";
import { supabase } from "@/integrations/supabase/client";

interface ChatLayoutProps {
  currentUser: string;
  onLogout: () => void;
}

export const ChatLayout = ({ currentUser, onLogout }: ChatLayoutProps) => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("discord_theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("discord_theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="h-screen bg-background text-foreground flex">
      <ChatSidebar
        currentUser={currentUser}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />
      
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <ChatArea currentUser={currentUser} selectedUser={selectedUser} />
        ) : (
          <div className="flex-1 bg-chat-bg flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome to Discord Clone
              </h2>
              <p className="text-muted-foreground">
                Select a user from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};