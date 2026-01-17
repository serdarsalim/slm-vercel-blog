"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";

interface CommentSectionProps {
  slug: string;
}

type Comment = {
  id: string;
  author_name: string;
  author_email: string;
  content: string;
  created_at: string;
};

export default function CommentSection({ slug }: CommentSectionProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load comments");
        }
        const data = await response.json();
        if (!cancelled) setComments(data.comments ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load comments");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const submitComment = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, content: draft.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post comment");
      }

      const data = await response.json();
      setComments((prev) => [data.comment, ...prev]);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    setDeletingId(id);
    setError(null);
    try {
      const response = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete comment");
      }
      setComments((prev) => prev.filter((comment) => comment.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.7 }}
      className="pt-12 mt-6"
    >
      <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
        <h3 className="text-xl font-bold mb-6">Comments</h3>

        {status === "loading" ? (
          <div className="h-16 flex items-center text-sm text-gray-500">Loading session...</div>
        ) : session ? (
          <div className="mb-8 space-y-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a comment..."
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-800 dark:text-gray-200"
              rows={4}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Signed in as {session.user?.name || session.user?.email}
              </span>
              <button
                type="button"
                onClick={submitComment}
                disabled={posting || !draft.trim()}
                className="px-4 py-2 rounded-md bg-orange-500 text-white text-sm hover:bg-orange-600 disabled:opacity-50"
              >
                {posting ? "Posting..." : "Post comment"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Sign in to leave a comment.
            </p>
            <button
              type="button"
              onClick={() => signIn("google")}
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm"
            >
              Sign in
            </button>
          </div>
        )}

        {loading ? (
          <div className="h-16 flex items-center text-sm text-gray-500">Loading comments...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : comments.length === 0 ? (
          <div className="text-sm text-gray-500">No comments yet.</div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {comment.author_name || "Anonymous"}
                  </div>
                  {session?.user?.email && comment.author_email === session.user.email && (
                    <button
                      type="button"
                      onClick={() => deleteComment(comment.id)}
                      disabled={deletingId === comment.id}
                      className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingId === comment.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(comment.created_at).toLocaleString()}
                </div>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
