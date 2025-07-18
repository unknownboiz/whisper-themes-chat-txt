import { useState, useEffect } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { ChatLayout } from "@/components/chat/ChatLayout";

const Index = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("discord_current_user");
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  const handleAuth = (username: string) => {
    setCurrentUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem("discord_current_user");
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <AuthForm onAuth={handleAuth} />;
  }

  return <ChatLayout currentUser={currentUser} onLogout={handleLogout} />;
};

export default Index;
