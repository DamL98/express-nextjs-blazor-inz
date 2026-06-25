export function Topbar() {
  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 md:px-8">
      <div className="flex items-center justify-between">
        <div className="md:hidden">
          <p className="text-sm font-semibold text-gray-900">
            Sale konferencyjne
          </p>
        </div>

        <div className="hidden md:block">
          <p className="text-sm text-gray-500">
            Panel użytkownika
          </p>
        </div>

        <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
          user@example.com
        </div>
      </div>
    </header>
  );
}