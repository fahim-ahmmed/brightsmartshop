'use client';

export default function Error({ reset }) {
  return (
    <main className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-default-600">We could not load this page. Please try again.</p>
      <button type="button" onClick={reset} className="mt-6 rounded-full bg-primary px-6 py-2 font-semibold text-primary-foreground">
        Try again
      </button>
    </main>
  );
}
