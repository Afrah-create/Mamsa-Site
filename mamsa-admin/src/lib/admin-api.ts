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

  const responseText = await response.text();
  let payload = {} as AdminApiResponse<T>;

  if (responseText) {
    try {
      payload = JSON.parse(responseText) as AdminApiResponse<T>;
    } catch {
      payload = {} as AdminApiResponse<T>;
    }
  }

  if (!response.ok) {
    console.error('API Error:', response.status, responseText);
    throw new Error(payload.error || payload.message || responseText || 'Request failed.');
  }

  if (payload.data !== undefined) {
    return payload.data;
  }

  return (payload as T) ?? (undefined as T);
}
