import type { Bookmark } from "@/types/bookmark";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (bookmark: Bookmark) => void;
}

export default function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 w-full md:w-1/2 py-4 shadow-sm flex items-start justify-between gap-4 hover:shadow-md transition-shadow">
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
          {new Date(bookmark.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
      <button
        onClick={() => onDelete(bookmark)}
        className="text-gray-300 hover:text-red-500 transition-colors mt-1 cursor-pointer"
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
  );
}
