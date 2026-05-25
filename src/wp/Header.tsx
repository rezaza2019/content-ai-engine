import { LogOut } from "lucide-react";

type HeaderProps = {
  onSearch?: (value: string) => void;
  onLogout?: () => void;
};

export default function Header({ onSearch, onLogout }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="font-black text-slate-900">WP Admin</div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search..."
            onChange={(event) => onSearch?.(event.target.value)}
            className="hidden sm:block w-72 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-sky-500"
          />
          <button
            type="button"
            onClick={onLogout}
            className="h-10 px-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors flex items-center gap-2 text-sm font-bold"
            title="Log out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
