import NextLink from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-default-600">The page you are looking for does not exist or has moved.</p>
      <NextLink href="/" className="mt-6 inline-block font-semibold text-primary hover:underline">
        Back to Home
      </NextLink>
    </main>
  );
}
