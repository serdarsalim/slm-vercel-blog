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

type PexelsPhoto = {
  id: number;
  alt: string;
  photographer: string;
  src: {
    medium: string;
    large: string;
  };
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
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [imageQuery, setImageQuery] = useState("");
  const [imageResults, setImageResults] = useState<PexelsPhoto[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageTab, setImageTab] = useState<"pexels" | "upload">("pexels");
  const [libraryImages, setLibraryImages] = useState<
    { name: string; url: string }[]
  >([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [imageTarget, setImageTarget] = useState<"content" | "featured">("content");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<any>(null);

  const handleContentChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, content: value }));
  }, []);

  const insertImageIntoEditor = (url: string, alt: string) => {
    if (editorRef.current) {
      editorRef.current.insertContent(
        `<img src="${url}" alt="${alt.replace(/\"/g, "&quot;")}" />`
      );
      return;
    }

    setForm((prev) => ({
      ...prev,
      content: `${prev.content}<p><img src="${url}" alt="${alt.replace(/\"/g, "&quot;")}" /></p>`,
    }));
  };

  const handlePexelsSelect = (photo: PexelsPhoto) => {
    const alt = photo.alt || "Pexels image";
    if (imageTarget === "featured") {
      setForm((prev) => ({
        ...prev,
        featuredImage: photo.src.large,
      }));
      setIsImageManagerOpen(false);
      return;
    }

    insertImageIntoEditor(photo.src.large, alt);
  };

  const searchPexels = async () => {
    const trimmed = imageQuery.trim();
    if (!trimmed) return;
    setImageLoading(true);
    setImageError(null);

    try {
      const response = await fetch(`/api/pexels/search?query=${encodeURIComponent(trimmed)}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to search Pexels");
      }
      const data = await response.json();
      setImageResults(data.photos ?? []);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Failed to search Pexels");
    } finally {
      setImageLoading(false);
    }
  };

  const fetchLibraryImages = async () => {
    setLibraryLoading(true);
    setLibraryError(null);
    try {
      const response = await fetch("/api/images/list");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load images");
      }
      const data = await response.json();
      setLibraryImages(data.images ?? []);
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : "Failed to load images");
    } finally {
      setLibraryLoading(false);
    }
  };

  const deleteLibraryImage = async (path: string) => {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    try {
      const response = await fetch("/api/images/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete image");
      }
      setLibraryImages((prev) => prev.filter((item) => item.name !== path));
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : "Failed to delete image");
    }
  };

  const uploadImage = async (file: File) => {
    if (!file) return;
    setUploadLoading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload/post-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to upload image");
      }

      const data = await response.json();
      const url = data.url as string;
      if (!url) throw new Error("Upload succeeded but no URL returned");

      if (imageTarget === "featured") {
        setForm((prev) => ({ ...prev, featuredImage: url }));
        setIsImageManagerOpen(false);
        setImageTab("library");
        fetchLibraryImages();
        return;
      }

      insertImageIntoEditor(url, file.name || "Uploaded image");
      setImageTab("library");
      fetchLibraryImages();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploadLoading(false);
    }
  };

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
            <div className="relative w-full max-w-7xl mx-auto my-6 rounded-2xl bg-white dark:bg-slate-900 p-6 md:p-10">
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
              <div className="flex flex-col gap-6 lg:flex-row">
                <aside className="lg:w-80 lg:shrink-0">
                  <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 sticky top-6">
                    <div className="space-y-3">
                      <label className="sr-only">Title</label>
                      <input
                        name="title"
                        value={form.title}
                        onChange={onInputChange}
                        placeholder="Title"
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-900"
                        required
                      />
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
                      <label className="sr-only">Categories</label>
                      <input
                        name="categories"
                        value={form.categories}
                        onChange={onInputChange}
                        placeholder="Categories"
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-slate-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="sr-only">Featured image</label>
                      <button
                        type="button"
                        onClick={() => {
                          setImageTarget("featured");
                          setIsImageManagerOpen(true);
                        }}
                        className="w-full rounded-md border border-dashed border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:border-orange-400 hover:text-orange-600 transition-colors"
                      >
                        {form.featuredImage ? "Change featured image" : "Pick featured image"}
                      </button>
                      {form.featuredImage && (
                        <div className="flex items-center gap-2">
                          <img
                            src={form.featuredImage}
                            alt="Featured"
                            className="h-12 w-16 rounded-md object-cover border border-gray-200 dark:border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({ ...prev, featuredImage: "" }))
                            }
                            className="text-xs text-gray-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2">
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

                    <div className="flex flex-wrap gap-3">
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
                  </div>
                </aside>

                <div className="flex-1 min-w-0">
                  <label className="sr-only">Content</label>
                  <div className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900">
                    <QuillEditor
                      value={form.content}
                      onChange={handleContentChange}
                      onEditorReady={(editor) => {
                        editorRef.current = editor;
                      }}
                      onOpenImageManager={() => {
                        setImageTarget("content");
                        setIsImageManagerOpen(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            </form>

            {isImageManagerOpen && (
              <div className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4">
                <div className="relative w-full max-w-5xl max-h-[90vh] min-h-[60vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">Pexels image manager</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Search and click an image to insert it at the cursor.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsImageManagerOpen(false)}
                      className="text-gray-500 hover:text-gray-800"
                      aria-label="Close image manager"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3 text-sm">
                      {(["pexels", "upload"] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => {
                            setImageTab(tab);
                            if (tab === "upload") fetchLibraryImages();
                          }}
                          className={`px-3 py-1.5 rounded-full border transition ${
                            imageTab === tab
                              ? "border-orange-400 bg-orange-100 text-orange-700"
                              : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {tab === "pexels" && "Pexels"}
                          {tab === "upload" && "Upload"}
                        </button>
                      ))}
                    </div>

                    {imageTab === "upload" && (
                      <div className="space-y-6">
                        <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) uploadImage(file);
                              event.currentTarget.value = "";
                            }}
                          />
                          {uploadLoading ? "Uploading..." : "Upload image"}
                        </label>
                        {uploadError && (
                          <p className="text-sm text-red-600">{uploadError}</p>
                        )}
                      </div>
                    )}

                    {imageTab === "pexels" && (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={imageQuery}
                            onChange={(event) => setImageQuery(event.target.value)}
                            placeholder="Search Pexels..."
                            className="flex-1 min-w-[200px] rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-slate-800"
                          />
                          <button
                            type="button"
                            onClick={searchPexels}
                            disabled={imageLoading}
                            className="px-3 py-2 rounded-md bg-gray-900 text-white text-sm disabled:opacity-60"
                          >
                            {imageLoading ? "Searching..." : "Search"}
                          </button>
                        </div>

                        {imageError && (
                          <p className="text-sm text-red-600">{imageError}</p>
                        )}

                        {imageResults.length > 0 && (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {imageResults.map((photo) => (
                              <button
                                type="button"
                                key={photo.id}
                                onClick={() => handlePexelsSelect(photo)}
                                className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 text-left"
                              >
                                <img
                                  src={photo.src.medium}
                                  alt={photo.alt || "Pexels image"}
                                  className="h-36 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                                />
                                <div className="p-2 text-xs text-gray-600 dark:text-gray-300">
                                  <span className="block truncate">{photo.photographer}</span>
                                  <span className="text-orange-500">Click to insert</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {imageTab === "upload" && (
                      <div className="space-y-3">
                        {libraryError && (
                          <p className="text-sm text-red-600">{libraryError}</p>
                        )}
                        {libraryLoading ? (
                          <p className="text-sm text-gray-500">Loading images...</p>
                        ) : libraryImages.length === 0 ? (
                          <p className="text-sm text-gray-500">No uploaded images yet.</p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {libraryImages.map((image) => (
                              <div
                                key={image.name}
                                className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePexelsSelect({
                                      id: 0,
                                      alt: image.name,
                                      photographer: "",
                                      src: { medium: image.url, large: image.url },
                                    } as PexelsPhoto)
                                  }
                                  className="block w-full text-left"
                                >
                                  <img
                                    src={image.url}
                                    alt={image.name}
                                    className="h-36 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                                  />
                                </button>
                                <div className="flex items-center justify-between gap-2 px-2 py-2 text-xs text-gray-600 dark:text-gray-300">
                                  <span className="truncate">{image.name.split("/").pop()}</span>
                                  <button
                                    type="button"
                                    onClick={() => deleteLibraryImage(image.name)}
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
          portalTarget
        )
        : null}
    </div>
  );
}
