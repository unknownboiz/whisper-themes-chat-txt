import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AuthFormProps {
  onAuth: (username: string) => void;
}

export const AuthForm = ({ onAuth }: AuthFormProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: "Error", 
        description: "Passwords don't match",
        variant: "destructive"
      });
      return;
    }

    const users = JSON.parse(localStorage.getItem("discord_users") || "{}");
    
    if (isLogin) {
      if (!users[username] || users[username] !== password) {
        toast({
          title: "Error",
          description: "Invalid username or password",
          variant: "destructive"
        });
        return;
      }
    } else {
      if (users[username]) {
        toast({
          title: "Error",
          description: "Username already exists",
          variant: "destructive"
        });
        return;
      }
      users[username] = password;
      localStorage.setItem("discord_users", JSON.stringify(users));
      toast({
        title: "Success",
        description: "Account created successfully!"
      });
    }

    localStorage.setItem("discord_current_user", username);
    onAuth(username);
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Discord Clone
          </CardTitle>
          <CardDescription>
            {isLogin ? "Welcome back!" : "Create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-input border-border"
                />
              </div>
            )}
            <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
              {isLogin ? "Sign In" : "Sign Up"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full" 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};