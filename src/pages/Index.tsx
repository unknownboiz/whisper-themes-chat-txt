import { useState, useEffect } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';

const Index = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Get username from profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', session.user.id)
            .single();
          
          if (profile) {
            setCurrentUser(profile.username);
          }
        } else {
          setUser(null);
          setCurrentUser(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        // Get username from profile
        supabase
          .from('profiles')
          .select('username')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setCurrentUser(profile.username);
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = (username: string) => {
    setCurrentUser(username);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUser(null);
  };

  if (!currentUser) {
    return <AuthForm onAuth={handleAuth} />;
  }

  return <ChatLayout currentUser={currentUser} onLogout={handleLogout} />;
};

export default Index;