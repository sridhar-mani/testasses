"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import supabaseClient from "@/utils/db";
import type { User } from "@supabase/supabase-js";
import type { Bookmark, RealtimeStatus } from "@/types/bookmark";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Bookmark | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeStatus>("connecting");

  const userRef = useRef<User | null>(null);
  userRef.current = user;
  const userId = user?.id;

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchBookmarks = useCallback(async () => {
    const { data } = await supabaseClient
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setBookmarks(data);
  }, []);

  useEffect(() => {
    if (userId) fetchBookmarks();
  }, [userId, fetchBookmarks]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabaseClient
      .channel("bookmarks-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchBookmarks();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("connected");
        else if (status === "CLOSED") setRealtimeStatus("disconnected");
        else setRealtimeStatus("connecting");
      });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [userId, fetchBookmarks]);

  const isValidUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const sanitizeInput = (value: string) => {
    return value
      .replace(/<[^>]*>/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");
  };

  const handleAddBookmark = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    if (!isValidUrl(trimmedUrl)) {
      alert("Please enter a valid URL (e.g. https://example.com)");
      return;
    }
    setAdding(true);
    const { error } = await supabaseClient.from("bookmarks").insert({
      url: trimmedUrl,
      title: title.trim() || trimmedUrl,
      user_id: user!.id,
    });
    if (!error) {
      setUrl("");
      setTitle("");
      fetchBookmarks();
    }
    setAdding(false);
  };

  const handleDeleteBookmark = async (id: string) => {
    await supabaseClient.from("bookmarks").delete().eq("id", id);
    setDeleteTarget(null);
    fetchBookmarks();
  };

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50">
        <div className="animate-pulse text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen w-screen bg-zinc-50 font-sans">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="font-bold text-lg tracking-tight">
            Smart Bookmark App
          </h1>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                realtimeStatus === "connected"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : realtimeStatus === "connecting"
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                    : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  realtimeStatus === "connected"
                    ? "bg-green-500"
                    : realtimeStatus === "connecting"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
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
                  <p className="text-sm font-medium leading-tight">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-400 leading-tight">
                    {user.email}
                  </p>
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
                      onClick={handleSignOut}
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

      <main className="w-full mx-auto px-6 py-8">
        <section className="mb-8">
          <h2 className="text-base font-semibold mb-4 flex items-center w-full justify-center gap-2">
            Add Bookmark
          </h2>
          <div className="bg-white rounded-xl w-1/2 border border-gray-200 p-5 shadow-sm">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="bookmark-url"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  URL
                </label>
                <input
                  id="bookmark-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleAddBookmark()}
                />
              </div>
              <div>
                <label
                  htmlFor="bookmark-title"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Title
                </label>
                <input
                  id="bookmark-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(sanitizeInput(e.target.value))}
                  placeholder="Enter bookmark title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleAddBookmark()}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleAddBookmark}
                  disabled={adding || !url.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer px-6"
                >
                  {adding ? "Adding..." : "Add Bookmark"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <p className="text-xs text-gray-400 mb-4">
          Bookmarks sync across tabs and devices in real-time.
        </p>

        <section>
          {bookmarks.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg mb-1">No bookmarks yet</p>
              <p className="text-sm">
                Add your first bookmark using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm flex items-start justify-between gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {bookmark.title}
                    </h3>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline truncate block"
                    >
                      {bookmark.url}
                    </a>
                    <p className="text-xs text-gray-400 mt-1">
                      Added{" "}
                      {new Date(bookmark.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(bookmark)}
                    className="text-gray-300 hover: hover:text-red-500 transition-colors mt-1 cursor-pointer"
                    aria-label="Delete bookmark"
                  >
                    <svg
                      className="size-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bookmark</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.title}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                deleteTarget && handleDeleteBookmark(deleteTarget.id)
              }
            >
              Delete Bookmark
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
