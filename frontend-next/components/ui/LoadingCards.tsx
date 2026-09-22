type LoadingCardsProps = {
  count?: number;
};

export function LoadingCards({ count = 3 }: LoadingCardsProps) {
  return (
    <div role="status" aria-label="Ładowanie danych" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <span className="sr-only">Ładowanie danych…</span>

      {Array.from({ length: count }, (_, index) => (
        <div key={index} aria-hidden="true" className="animate-pulse rounded-2xl border border-app-line bg-white p-6 motion-reduce:animate-none">
          <div className="mb-6 h-12 w-12 rounded-xl bg-slate-100" />
          <div className="h-5 w-2/3 rounded bg-slate-100" />
          <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
          <div className="mt-8 h-10 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
