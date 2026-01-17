"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { BlogPost } from "@/app/types/blogpost";
import QuillEditor from "./QuillEditor";

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

const createSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function formatCategories(post?: AdminPost) {
  if (!post?.categories) return "";

  let categories = post.categories;

  // If it's a string that looks like JSON, parse it
  if (typeof categories === 'string') {
    try {
      // Try to parse as JSON in case it's a JSON-encoded string
      const parsed = JSON.parse(categories);
      if (Array.isArray(parsed)) {
        categories = parsed;
      }
    } catch {
      // If parsing fails, treat it as a regular string
      // Already a plain string, keep as is
    }
  }

  // Now handle the processed categories
  if (Array.isArray(categories)) {
    return categories.join(", ");
  }

  return String(categories);
}

interface AdminPostManagerProps {
  initialPosts?: AdminPost[];
}

export default function AdminPostManager({
  initialPosts = [],
}: AdminPostManagerProps) {
  const [posts, setPosts] = useState<AdminPost[]>(initialPosts);
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "drafts">("all");
  const [sortKey, setSortKey] = useState<"title" | "categories" | "updated">("updated");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loadingState, setLoadingState] = useState<"idle" | "saving" | "deleting" | "refreshing">("idle");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const handleContentChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, content: value }));
  }, []);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("adminPostStatusFilter");
    if (saved === "all" || saved === "published" || saved === "drafts") {
      setStatusFilter(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("adminPostStatusFilter", statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    if (isSearchExpanded) {
      searchInputRef.current?.focus();
    }
  }, [isSearchExpanded]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyWidth = document.body.style.width;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.width = originalBodyWidth;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isModalOpen]);

  useEffect(() => {
    setCategoryDrafts((prev) => {
      const next = { ...prev };
      posts.forEach((post) => {
        if (!next[post.id]) {
          next[post.id] = formatCategories(post);
        }
      });
      return next;
    });
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const filtered = posts.filter((post) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && post.published) ||
        (statusFilter === "drafts" && !post.published);

      const matchesSearch =
        !search ||
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.slug.toLowerCase().includes(search.toLowerCase());

      const postDate = post.date ? new Date(post.date) : null;
      const matchesDate =
        (!dateFrom || (postDate && postDate >= new Date(dateFrom))) &&
        (!dateTo || (postDate && postDate <= new Date(dateTo)));

      return matchesStatus && matchesSearch && matchesDate;
    });

    const direction = sortDirection === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "updated") {
        const aDate = a.updated_at ?? a.date ?? "";
        const bDate = b.updated_at ?? b.date ?? "";
        const aTime = Number.isNaN(Date.parse(aDate)) ? 0 : new Date(aDate).getTime();
        const bTime = Number.isNaN(Date.parse(bDate)) ? 0 : new Date(bDate).getTime();
        return (aTime - bTime) * direction;
      }

      const aValue =
        sortKey === "title" ? a.title ?? "" : formatCategories(a).toLowerCase();
      const bValue =
        sortKey === "title" ? b.title ?? "" : formatCategories(b).toLowerCase();

      return aValue.localeCompare(bValue) * direction;
    });

    return sorted;
  }, [posts, statusFilter, search, dateFrom, dateTo, sortKey, sortDirection]);

  const toggleSort = (key: "title" | "categories" | "updated") => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(key === "updated" ? "desc" : "asc");
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultFormState());
    setIsModalOpen(false);
  };

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const selectPostForEditing = (post: AdminPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? "",
      content: post.content,
      categories: formatCategories(post),
      date: post.date ? post.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      featuredImage: post.featuredImage ?? "",
      author: post.author ?? "HALQA",
      author_handle: post.author_handle ?? "halqa",
      featured: post.featured ?? false,
      comment: post.comment ?? true,
      socmed: post.socmed ?? true,
      published: post.published ?? false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingState("saving");
    setMessage(null);

    const slug = editingId ? form.slug : form.slug || createSlug(form.title);
    const payload = {
      ...form,
      slug,
      date: form.date ? new Date(form.date).toISOString() : undefined,
    };

    try {
      const response = await fetch(editingId ? `/api/admin/posts/${editingId}` : "/api/admin/posts", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save post");
      }

      setMessage({ type: "success", text: editingId ? "Post updated" : "Post created" });
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
      const response = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
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

      setMessage({ type: "success", text: !post.published ? "Post published" : "Post unpublished" });
      await refreshPosts();
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update status",
      });
    } finally {
      setLoadingState("idle");
    }
  };

  const saveCategories = async (post: AdminPost) => {
    const draft = (categoryDrafts[post.id] ?? "").trim();
    const current = formatCategories(post);

    if (draft === current) return;

    setLoadingState("saving");
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: draft }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update categories");
      }

      const data = await response.json();
      setPosts((prev) => prev.map((item) => (item.id === post.id ? data.post : item)));
      setCategoryDrafts((prev) => ({
        ...prev,
        [post.id]: formatCategories(data.post),
      }));
      setMessage({ type: "success", text: "Categories updated" });
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update categories",
      });
    } finally {
      setLoadingState("idle");
    }
  };

  const onInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { name, value, type } = target;
    const nextValue =
      type === "checkbox" && "checked" in target
        ? target.checked
        : value;

    setForm((prev) => {
      if (name === "title" && typeof nextValue === "string") {
        return {
          ...prev,
          title: nextValue,
          slug: createSlug(nextValue),
        };
      }

      return {
        ...prev,
        [name]: nextValue,
      };
    });
  };

  return (
    <div className="space-y-8">
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

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-3 flex-nowrap">
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
              {filter === "drafts" ? "Drafts" : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <label className="text-sm text-gray-500">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-sm bg-white dark:bg-slate-800"
            />
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <label className="text-sm text-gray-500">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-sm bg-white dark:bg-slate-800"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {!isSearchExpanded ? (
            <button
              type="button"
              onClick={() => setIsSearchExpanded(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300"
              aria-label="Search posts"
              title="Search posts"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </button>
          ) : (
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => {
                if (!search.trim()) setIsSearchExpanded(false);
              }}
              className="w-full sm:w-44 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-sm"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={refreshPosts}
              disabled={loadingState === "refreshing"}
              className="px-3 py-2 rounded-md bg-gray-900 text-white text-sm hover:bg-gray-700 disabled:opacity-50"
            >
              {loadingState === "refreshing" ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={openModal}
              className="px-3 py-2 rounded-md bg-orange-500 text-white text-sm hover:bg-orange-600"
            >
              New Post
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800 shadow-sm">
        <table className="w-full min-w-[900px] text-sm text-left">
          <thead className="bg-gray-50 dark:bg-slate-900">
            <tr className="text-xs uppercase text-gray-500 dark:text-gray-400">
              <th className="px-4 py-3 w-2/5">
                <button
                  type="button"
                  onClick={() => toggleSort("title")}
                  className="flex items-center gap-2 text-left"
                >
                  <span>Title</span>
                  {sortKey === "title" && (
                    <span className="text-gray-400">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort("categories")}
                  className="flex items-center gap-2 text-left"
                >
                  <span>Categories</span>
                  {sortKey === "categories" && (
                    <span className="text-gray-400">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort("updated")}
                  className="flex items-center gap-2 text-left"
                >
                  <span>Updated</span>
                  {sortKey === "updated" && (
                    <span className="text-gray-400">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No posts match your filters.
                </td>
              </tr>
            ) : (
              filteredPosts.map((post) => (
                <tr
                  key={post.id}
                  className="border-t border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <td className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => selectPostForEditing(post)}
                      className="text-left hover:underline"
                    >
                      {post.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={categoryDrafts[post.id] ?? ""}
                      onChange={(event) =>
                        setCategoryDrafts((prev) => ({
                          ...prev,
                          [post.id]: event.target.value,
                        }))
                      }
                      onBlur={() => saveCategories(post)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          saveCategories(post);
                          (event.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-full rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-sm bg-white dark:bg-slate-800"
                      placeholder="e.g. finance, tools"
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {post.updated_at ? new Date(post.updated_at).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePublish(post)}
                      aria-label={post.published ? "Unpublish post" : "Publish post"}
                      title={post.published ? "Unpublish post" : "Publish post"}
                      className={`text-xs px-2 py-1 rounded-md border ${
                        post.published
                          ? "border-green-200 bg-green-100 text-green-700"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {post.published ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" />
                          <circle cx="12" cy="12" r="3" />
                          <path d="M3 3l18 18" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      aria-label="Delete post"
                      title="Delete post"
                      className="inline-flex items-center justify-center rounded-md border border-red-300 px-2 py-1 text-red-600"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && portalTarget
        ? createPortal(
          <div className="fixed inset-0 z-[2147483647] bg-black/80 overflow-y-auto pointer-events-auto">
            <div className="relative w-full max-w-5xl mx-auto my-6 rounded-2xl bg-white dark:bg-slate-900 p-6 md:p-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingId ? "Edit Post" : "Create New Post"}
                </h2>
              </div>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-800">
                ✕
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_140px_200px_180px]">
                <div>
                  <label className="sr-only">Title</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={onInputChange}
                    placeholder="Title"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="sr-only">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={onInputChange}
                    aria-label="Date"
                    placeholder="Date"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="sr-only">Categories</label>
                  <input
                    name="categories"
                    value={form.categories}
                    onChange={onInputChange}
                    placeholder="Categories"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="sr-only">Featured image URL</label>
                  <input
                    name="featuredImage"
                    value={form.featuredImage}
                    onChange={onInputChange}
                    placeholder="Featured image URL"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="sr-only">Content</label>
                <div className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900">
                  <QuillEditor value={form.content} onChange={handleContentChange} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
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
                  Comments
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="socmed"
                    checked={form.socmed}
                    onChange={onInputChange}
                    className="rounded border-gray-300"
                  />
                  Social share
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loadingState === "saving"}
                  className="px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {loadingState === "saving" ? "Saving..." : editingId ? "Save changes" : "Create post"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
            </div>
          </div>,
          portalTarget
        )
        : null}
    </div>
  );
}
