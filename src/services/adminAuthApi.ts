export type AdminAuthStatus = {
  authenticated: boolean;
  username: string | null;
};

export async function fetchAdminAuthStatus(): Promise<AdminAuthStatus> {
  const response = await fetch("/api/admin-auth/status");
  if (!response.ok) {
    throw new Error("Failed to check admin login status.");
  }

  return response.json();
}

export async function loginAdmin(username: string, password: string): Promise<AdminAuthStatus> {
  const response = await fetch("/api/admin-auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Admin login failed.");
  }

  return data;
}

export async function logoutAdmin() {
  await fetch("/api/admin-auth/logout", { method: "POST" });
}
