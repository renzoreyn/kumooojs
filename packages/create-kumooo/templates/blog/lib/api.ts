const API =
  process.env.NEXT_PUBLIC_KUMOOO_API_URL?.replace(/\/$/, "") || "https://api.kumooo.dev";

const TOKEN_KEY = "kumooo_blog_demo_token";

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type AdminComment = PublicComment & {
  postId: string;
  postTitle: string;
  postSlug: string;
  authorEmail: string;
};

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getBlogDemoToken(): string | null {
  return getToken();
}

function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function api<T>(path: string, init?: RequestInit, auth = false): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `http_${res.status}`);
  }
  return data;
}

export const blogApi = {
  listPosts: () => api<{ posts: Post[] }>("/demo/blog/posts"),
  getPost: (slug: string) => api<{ post: Post }>(`/demo/blog/posts/${encodeURIComponent(slug)}`),
  listComments: (slug: string) =>
    api<{ comments: PublicComment[] }>(`/demo/blog/posts/${encodeURIComponent(slug)}/comments`),
  addComment: (slug: string, body: { name: string; email: string; body: string }) =>
    api<{ ok: true; comment: PublicComment }>(`/demo/blog/posts/${encodeURIComponent(slug)}/comments`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: async (username: string, password: string) => {
    const data = await api<{ ok: true; token: string }>("/demo/blog/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    return data;
  },
  logout: async () => {
    try {
      await api<{ ok: true }>("/demo/blog/admin/logout", { method: "POST" }, true);
    } finally {
      setToken(null);
    }
  },
  me: () => api<{ ok: true; user: string }>("/demo/blog/admin/me", undefined, true),
  adminPosts: () => api<{ posts: Post[] }>("/demo/blog/admin/posts", undefined, true),
  createPost: (body: {
    title: string;
    body: string;
    slug?: string;
    excerpt?: string;
    status?: string;
  }) => api<{ post: Post }>("/demo/blog/admin/posts", { method: "POST", body: JSON.stringify(body) }, true),
  updatePost: (
    id: string,
    body: { title?: string; slug?: string; excerpt?: string; body?: string; status?: string },
  ) =>
    api<{ post: Post }>(
      `/demo/blog/admin/posts/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
      true,
    ),
  deletePost: (id: string) =>
    api<{ ok: true }>(`/demo/blog/admin/posts/${id}`, { method: "DELETE" }, true),
  adminComments: () => api<{ comments: AdminComment[] }>("/demo/blog/admin/comments", undefined, true),
  deleteComment: (id: string) =>
    api<{ ok: true }>(`/demo/blog/admin/comments/${id}`, { method: "DELETE" }, true),
};

export { API as blogApiBase };
