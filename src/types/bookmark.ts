export interface Bookmark {
  id: string;
  url: string;
  title: string;
  created_at: string;
  user_id: string;
}

export type RealtimeStatus = "connecting" | "connected" | "disconnected";
