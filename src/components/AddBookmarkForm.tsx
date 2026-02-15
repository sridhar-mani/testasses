"use client";

import { Button } from "@/components/ui/button";

interface AddBookmarkFormProps {
  url: string;
  title: string;
  adding: boolean;
  onUrlChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onSubmit: () => void;
}

export default function AddBookmarkForm({
  url,
  title,
  adding,
  onUrlChange,
  onTitleChange,
  onSubmit,
}: AddBookmarkFormProps) {
  return (
    <section className="mb-8 flex flex-col items-center justify-center">
      <h2 className="text-base font-semibold mb-4 flex items-center w-full justify-center gap-2">
        Add Bookmark
      </h2>
      <div className="bg-white rounded-xl w-full md:w-1/2 border border-gray-200 p-5 shadow-sm">
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
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
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
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Enter bookmark title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={onSubmit}
              disabled={adding || !url.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer px-6"
            >
              {adding ? "Adding..." : "Add Bookmark"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
