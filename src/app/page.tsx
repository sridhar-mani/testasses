"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import supabaseClient from "@/utils/db";
import type { User } from "@supabase/supabase-js";
import type { Bookmark, RealtimeStatus } from "@/types/bookmark";
import Header from "@/components/Header";
import AddBookmarkForm from "@/components/AddBookmarkForm";
import BookmarkCard from "@/components/BookmarkCard";
import DeleteDialog from "@/components/DeleteDialog";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Bookmark | null>(null);
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
      <Header
        userName={userName}
        email={user.email || ""}
        avatarUrl={avatarUrl}
        realtimeStatus={realtimeStatus}
        onSignOut={handleSignOut}
      />

      <main className="w-full mx-auto px-6 py-8">
        <AddBookmarkForm
          url={url}
          title={title}
          adding={adding}
          onUrlChange={setUrl}
          onTitleChange={(val) => setTitle(sanitizeInput(val))}
          onSubmit={handleAddBookmark}
        />

        <p className="text-xs w-full text-center text-gray-400 mb-4">
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
            <div className="space-y-3 w-full items-center justify-center flex flex-col">
              {bookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <DeleteDialog
        bookmark={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteBookmark}
      />
    </div>
  );
}
