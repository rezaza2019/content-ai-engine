export type WpAuthStatus = {
  hasCredentials: boolean;
  canWrite: boolean;
  roles?: string[];
  username?: string;
  message?: string | null;
};

export async function fetchWpAuthStatus(): Promise<WpAuthStatus> {
  const response = await fetch("/api/wp/auth-status");
  return response.json();
}
