const API =
  process.env.NEXT_PUBLIC_KUMOOO_API_URL?.replace(/\/$/, "") || "https://api.kumooo.dev";

const TOKEN_KEY = "kumooo_shop_demo_token";

export type ProductColor = { name: string; hex: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: string;
  blurb: string;
  description: string;
  imageUrl: string | null;
  sizes: string[];
  colors: ProductColor[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getShopDemoToken(): string | null {
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

export type ProductInput = {
  name: string;
  price: string;
  slug?: string;
  blurb?: string;
  description?: string;
  imageUrl?: string;
  sizes?: string[];
  colors?: ProductColor[];
  sizesText?: string;
  colorsText?: string;
  status?: string;
};

export const shopApi = {
  listProducts: () => api<{ products: Product[] }>("/demo/shop/products"),
  getProduct: (slug: string) =>
    api<{ product: Product }>(`/demo/shop/products/${encodeURIComponent(slug)}`),
  login: async (username: string, password: string) => {
    const data = await api<{ ok: true; token: string }>("/demo/shop/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    return data;
  },
  logout: async () => {
    try {
      await api<{ ok: true }>("/demo/shop/admin/logout", { method: "POST" }, true);
    } finally {
      setToken(null);
    }
  },
  me: () => api<{ ok: true; user: string }>("/demo/shop/admin/me", undefined, true),
  adminProducts: () => api<{ products: Product[] }>("/demo/shop/admin/products", undefined, true),
  createProduct: (body: ProductInput) =>
    api<{ product: Product }>(
      "/demo/shop/admin/products",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),
  updateProduct: (id: string, body: Partial<ProductInput>) =>
    api<{ product: Product }>(
      `/demo/shop/admin/products/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
      true,
    ),
  deleteProduct: (id: string) =>
    api<{ ok: true }>(`/demo/shop/admin/products/${id}`, { method: "DELETE" }, true),
};

export { API as shopApiBase };
