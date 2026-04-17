"use client";

import { Suspense, useState } from "react";
import LeftSidebar from "./left-sidebar";
import GroupsSidebar from "./groups-sidebar";
import { X, Menu } from "lucide-react";

import {} from "lucide-react";

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Desktop */}
      <div className="hidden lg:flex">
        <LeftSidebar />
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg"
      >
        {mobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-lg z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar Mobile */}
      <div
        className={`fixed left-0 top-0 h-screen w-auto bg-card border-r border-border z-40 transform transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <LeftSidebar />
      </div>

      {/* Groups Sidebar */}
      <Suspense fallback={<div className="">loading</div>}>
        <div className="hidden md:flex">
          <GroupsSidebar />
        </div>
      </Suspense>

      {/* Mobile Groups Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-72 bg-card border-r border-border z-40 transform transition-transform duration-300 md:hidden ${
          mobileMenuOpen
            ? "translate-x-64 max-[564px]:translate-x-0"
            : "-translate-x-full"
        }  `}
      >
        <Suspense fallback={<div className="">loading</div>}>
          <GroupsSidebar />
        </Suspense>
      </div>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
