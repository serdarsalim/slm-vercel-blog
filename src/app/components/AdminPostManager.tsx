"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BlogPost } from "@/app/types/blogpost";

type AdminPost = BlogPost & { published?: boolean };

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categories: string;
  date: string;
  featuredImage: string;
  author: string;
  author_handle: string;
  featured: boolean;
  comment: boolean;
  socmed: boolean;
  published: boolean;
};

const defaultFormState = (): FormState => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  categories: "",
  date: new Date().toISOString().slice(0, 10),
  featuredImage: "",
  author: "HALQA",
  author_handle: "halqa",
  featured: false,
  comment: true,
  socmed: true,
  published: false,
});

function formatCategories(post?: AdminPost) {
  if (!post?.categories) return "";
  return Array.isArray(post.categories) ? post.categories.join(", ") : "";
}

interface AdminPostManagerProps {
  initialPosts?: AdminPost[];
}

export default function AdminPostManager({
  initialPosts = [],
}: AdminPostManagerProps) {
  const [posts, setPosts] = useState<AdminPost[]>(initialPosts);
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "drafts"
  >("all");
  const [loadingState, setLoadingState] = useState<
    "idle" | "saving" | "deleting" | "refreshing"
  >("idle");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const refreshPosts = useCallback(async () => {
    setLoadingState("refreshing");
    try {
      const response = await fetch("/api/admin/posts", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to refresh posts");
      const data = await response.json();
      setPosts(data.posts ?? []);
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Could not load posts" });
    } finally {
      setLoadingState("idle");
    }
  }, []);

  useEffect(() => {
    if (initialPosts.length === 0) {
      refreshPosts();
    }
  }, [initialPosts.length, refreshPosts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesFilter =
        statusFilter === "all" ||
        (statusFilter === "published" && post.published) ||
        (statusFilter === "drafts" && !post.published);

      const matchesSearch =
        !search ||
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.slug.toLowerCase().includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [posts, statusFilter, search]);

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultFormState());
  };

  const selectPostForEditing = (post: AdminPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? "",
      content: post.content,
      categories: formatCategories(post),
      date: post.date
        ? post.date.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      featuredImage: post.featuredImage ?? "",
      author: post.author ?? "HALQA",
      author_handle: post.author_handle ?? "halqa",
      featured: post.featured ?? false,
      comment: post.comment ?? true,
      socmed: post.socmed ?? true,
      published: post.published ?? false,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingState("saving");
    setMessage(null);

    const payload = {
      ...form,
      date: form.date ? new Date(form.date).toISOString() : undefined,
    };

    try {
      const response = await fetch(
        editingId ? `/api/admin/posts/${editingId}` : "/api/admin/posts",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save post");
      }

      setMessage({
        type: "success",
        text: editingId ? "Post updated" : "Post created",
      });
      resetForm();
      await refreshPosts();
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save post",
      });
    } finally {
      setLoadingState("idle");
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setLoadingState("deleting");
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete post");
      }
      setMessage({ type: "success", text: "Post deleted" });
      if (editingId === id) resetForm();
      await refreshPosts();
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete post",
      });
    } finally {
      setLoadingState("idle");
    }
  };

  const togglePublish = async (post: AdminPost) => {
    setLoadingState("saving");
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !post.published }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update publish status");
      }

      setMessage({
        type: "success",
        text: !post.published ? "Post published" : "Post unpublished",
      });
      await refreshPosts();
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to update status",
      });
    } finally {
      setLoadingState("idle");
    }
  };

  const onInputChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="space-y-10">
      {message && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "published", "drafts"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                statusFilter === filter
                  ? "bg-orange-500 text-white border-orange-500"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              {filter === "drafts"
                ? "Drafts"
                : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full lg:w-64 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-sm"
          />
          <button
            onClick={refreshPosts}
            disabled={loadingState === "refreshing"}
            className="px-3 py-2 rounded-md bg-gray-900 text-white text-sm hover:bg-gray-700 disabled:opacity-50"
          >
            {loadingState === "refreshing" ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          {filteredPosts.length === 0 ? (
            <p className="text-sm text-gray-500">
              No posts match your filters.
            </p>
          ) : (
            filteredPosts.map((post) => (
              <article
                key={post.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-500">{post.slug}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          post.published
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </span>
                      {post.featured && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => selectPostForEditing(post)}
                      className="text-xs px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => togglePublish(post)}
                      className="text-xs px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600"
                    >
                      {post.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-xs px-3 py-1 rounded-md border border-red-300 text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Post" : "Create New Post"}
              </h2>
              {editingId && (
                <p className="text-xs text-gray-500">
                  Editing existing entry.{" "}
                  <button
                    onClick={resetForm}
                    className="underline text-blue-600 dark:text-blue-400"
                  >
                    Start fresh
                  </button>
                </p>
              )}
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                name="title"
                value={form.title}
                onChange={onInputChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-900"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={onInputChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={onInputChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Author</label>
                <input
                  name="author"
                  value={form.author}
                  onChange={onInputChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Author Handle
                </label>
                <input
                  name="author_handle"
                  value={form.author_handle}
                  onChange={onInputChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Excerpt</label>
              <textarea
                name="excerpt"
                value={form.excerpt}
                onChange={onInputChange}
                rows={3}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                name="content"
                value={form.content}
                onChange={onInputChange}
                rows={8}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-900"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Categories
                </label>
                <input
                  name="categories"
                  value={form.categories}
                  onChange={onInputChange}
                  placeholder="e.g. finance, tools"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Featured Image URL
                </label>
                <input
                  name="featuredImage"
                  value={form.featuredImage}
                  onChange={onInputChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="published"
                  checked={form.published}
                  onChange={onInputChange}
                  className="rounded border-gray-300"
                />
                Published
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="featured"
                  checked={form.featured}
                  onChange={onInputChange}
                  className="rounded border-gray-300"
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="comment"
                  checked={form.comment}
                  onChange={onInputChange}
                  className="rounded border-gray-300"
                />
                Comments enabled
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="socmed"
                  checked={form.socmed}
                  onChange={onInputChange}
                  className="rounded border-gray-300"
                />
                Social share enabled
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loadingState === "saving"}
                className="px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {loadingState === "saving"
                  ? "Saving..."
                  : editingId
                  ? "Save changes"
                  : "Create post"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
