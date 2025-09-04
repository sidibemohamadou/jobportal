// API utility functions
export async function makeRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const response = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  return response;
}

export async function apiPost(url: string, data: unknown): Promise<any> {
  const response = await makeRequest("POST", url, data);
  return response.json();
}

export async function apiPut(url: string, data: unknown): Promise<any> {
  const response = await makeRequest("PUT", url, data);
  return response.json();
}

export async function apiGet(url: string): Promise<any> {
  const response = await makeRequest("GET", url);
  return response.json();
}

export async function apiDelete(url: string): Promise<any> {
  const response = await makeRequest("DELETE", url);
  return response.json();
}