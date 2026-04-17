"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { LogOut, User, Settings } from "lucide-react";

interface UserProfile {
  username: string;
  email: string;
  avatar_url?: string;
}

export default function LeftSidebar() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const supabase = createClient();
        const { data: user } = await supabase.auth.getUser();
        if (user?.user?.email) {
          const { data } = await supabase
            .from("profile")
            .select("username, email, avatar_url")
            .eq("email", user.user.email)
            .single();

          setProfile(data || { 
            username: user.user.email?.split("@")[0] || "User", 
            email: user.user.email || "" 
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0 p-4 gap-6">
      {/* User Profile Section */}
      <div className="flex flex-col gap-3 border-b border-border pb-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground font-semibold text-lg mx-auto">
          {profile?.username?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm truncate">
            {profile?.username || "Loading..."}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {profile?.email || ""}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1">
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary text-sm font-medium transition">
          <User className="w-4 h-4" />
          Profile
        </button>
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary text-sm font-medium transition">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </nav>

      {/* Logout Button */}
      <Button
        onClick={handleLogout}
        variant="destructive"
        className="w-full flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </Button>

      {/* Status Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        Online
      </div>
    </aside>
  );
}
