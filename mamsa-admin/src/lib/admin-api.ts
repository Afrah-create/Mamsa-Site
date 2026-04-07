export type AdminApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
};

export async function adminRequest<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as AdminApiResponse<T>;

  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'Request failed.');
  }

  return (payload.data ?? (payload as T)) as T;
}
