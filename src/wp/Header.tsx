type HeaderProps = {
  onSearch?: (value: string) => void;
};

export default function Header({ onSearch }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="font-black text-slate-900">WP Admin</div>
        <input
          type="search"
          placeholder="Search..."
          onChange={(event) => onSearch?.(event.target.value)}
          className="hidden sm:block w-72 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-sky-500"
        />
      </div>
    </header>
  );
}
