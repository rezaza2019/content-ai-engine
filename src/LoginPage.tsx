import { FormEvent, useState } from "react";
import { Lock, LogIn, Shield } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { loginAdmin } from "./services/adminAuthApi";

type LoginPageProps = {
  authenticated: boolean;
  onLogin: () => void;
};

export default function LoginPage({ authenticated, onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isLocalhost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);

  const redirectTo =
    typeof location.state === "object" &&
    location.state &&
    "from" in location.state &&
    typeof location.state.from === "string"
      ? location.state.from
      : "/wp";

  if (authenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isLocalhost) {
      setError(
        "Admin login is disabled when running locally. Deploy to production to use admin login."
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await loginAdmin(username.trim(), password);
      onLogin();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-slate-50 px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Admin Login
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Sign in with the admin account.
            </p>
          </div>
        </div>

        {isLocalhost && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 mb-5">
            Admin login is disabled on localhost. Deploy to a production environment to use admin login.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="admin-username" className="text-sm font-bold text-slate-700">
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="admin-password" className="text-sm font-bold text-slate-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting || !username.trim() || !password || isLocalhost
            }
            className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <LogIn size={18} />
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
