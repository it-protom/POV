"use client";

// next-auth removed - needs custom auth;
import { Button } from '../ui/button';
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const handleLogout = () => {
    signOut({ callbackUrl: "http://localhost:3000/auth/signin" });
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      <span>Logout</span>
    </Button>
  );
} 
