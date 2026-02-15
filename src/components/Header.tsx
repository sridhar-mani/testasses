"use client";

import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { RealtimeStatus } from "@/types/bookmark";

interface HeaderProps {
  userName: string;
  email: string;
  avatarUrl?: string;
  realtimeStatus: RealtimeStatus;
  onSignOut: () => void;
}

export default function Header({
  userName,
  email,
  avatarUrl,
  realtimeStatus,
  onSignOut,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const statusStyles = {
    connected: "bg-green-50 text-green-700 border-green-200",
    connecting: "bg-yellow-50 text-yellow-700 border-yellow-200",
    disconnected: "bg-red-50 text-red-700 border-red-200",
  };

  const dotStyles = {
    connected: "bg-green-500",
    connecting: "bg-yellow-500",
    disconnected: "bg-red-500",
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="w-full mx-auto px-6 h-14 flex items-center justify-between">
        <h1 className="font-bold text-lg tracking-tight">
          Smart Bookmark App
        </h1>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyles[realtimeStatus]}`}
          >
            <span className={`size-1.5 rounded-full ${dotStyles[realtimeStatus]}`} />
            Realtime:{" "}
            {realtimeStatus.charAt(0).toUpperCase() + realtimeStatus.slice(1)}
          </span>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Avatar size="default">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback>
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-tight">{userName}</p>
                <p className="text-xs text-gray-400 leading-tight">{email}</p>
              </div>
              <svg
                className={`size-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <div className="px-4 py-2 text-sm text-gray-700 font-medium border-b border-gray-100">
                    {userName}
                  </div>
                  <button
                    onClick={onSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
