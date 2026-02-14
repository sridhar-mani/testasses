# Smart Bookmark App

Bookmark manager with Google login and real-time sync.

**Live:** [https://test-three-beige-75.vercel.app/](https://test-three-beige-75.vercel.app/)

## Stack

Next.js 15 (App Router), Supabase (auth + db + realtime), Tailwind CSS, `@supabase/ssr`

## Problems I ran into

### Callback route not working

After Google redirects back with a `?code=`, I needed to exchange it for a session. Kept getting null back. Spent a while on this before realizing the cookie handling was wrong — `@supabase/ssr` needs `getAll`/`setAll` methods and I was using the old `get`/`set` API from the docs I was looking at (which were for an older version). Once I switched to the correct cookie methods the PKCE flow started working.

### Home page blank after login

Login would work fine (I could see the session in the network tab) but the page would just sit there showing nothing. I wasn't calling `getSession()` on mount so the component had no idea there was already a session. Added that and `onAuthStateChange` to keep it updated.

### Realtime kept reconnecting in a loop

Console was spammed with "WebSocket is closed before the connection is established". I had the `user` object as a useEffect dependency for the realtime subscription. The thing is, `onAuthStateChange` fires on token refresh too, and each time it gives you a new object reference even though the user hasn't changed. React sees the new reference, tears down the effect, and re-runs it — closing and reopening the WebSocket endlessly. Switched to using `user?.id` (a string) as the dep instead, which fixed it since strings compare by value.

### Wrong router import

Was using `import { useRouter } from 'next/router'` but this is App Router so it should be `next/navigation`. Also had it placed after an early return which breaks hooks rules.
