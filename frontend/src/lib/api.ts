// Always same-origin: nginx (prod) or Vite (dev) proxies /api/* to the backend.
const BASE = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail);
  }
}

export function apiBase(): string {
  return BASE;
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const hasBody = options.body !== undefined;
  const res = await fetch(BASE + path, {
    method: options.method ?? (hasBody ? "POST" : "GET"),
    credentials: "include",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      "X-Requested-With": "paypilot",
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
    } catch { /* keep statusText */ }
    if (res.status === 401 && path !== "/auth/login" && path !== "/auth/logout") {
      sessionStorage.removeItem("email");
      window.location.assign("/login?expired=1");
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}