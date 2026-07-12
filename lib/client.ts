// Small JSON fetch helper used by client components. Throws with the server
// provided error message so mutations can surface rule violations as toasts.
export async function jsonFetch<T = any>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || "Request failed");
  return data as T;
}
