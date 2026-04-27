const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const apiKey = localStorage.getItem('turtletrace_api_key');

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'X-API-Key': apiKey }),
      ...options?.headers,
    },
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

// Initialize API Key: prefer localStorage, fallback to .api-key file
async function initApiKey() {
  let key = localStorage.getItem('turtletrace_api_key');
  if (!key) {
    try {
      const res = await fetch('/api-key');
      if (res.ok) {
        key = await res.text();
        localStorage.setItem('turtletrace_api_key', key.trim());
      }
    } catch {
      // Backend not running or .api-key not exists, ignore
    }
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { initApiKey };
