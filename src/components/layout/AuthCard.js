export default function AuthCard({ title, subtitle, children }) {
  return (
    <main className="mx-auto flex max-w-lg flex-col px-4 py-12">
      <div className="rounded-2xl border border-divider bg-content1 p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mb-6 mt-1 text-default-600">{subtitle}</p>}
        {!subtitle && <div className="mb-6" />}
        {children}
      </div>
    </main>
  );
}
