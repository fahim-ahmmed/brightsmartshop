import NextLink from 'next/link';
import { SITE } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-divider bg-content2">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold">{SITE.name}</p>
          <p className="mt-1 text-default-600">{SITE.tagline}</p>
        </div>
        <a
          href={`https://wa.me/${SITE.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center rounded-full bg-primary px-5 py-2 font-medium text-primary-foreground hover:opacity-90"
        >
          WhatsApp
        </a>
      </div>
      <div className="border-t border-divider px-4 py-4 text-center text-sm text-default-600">
        {SITE.copyright} ·{' '}
        <NextLink href="/privacy-policy" className="hover:text-primary hover:underline">
          Privacy
        </NextLink>{' '}
        <NextLink href="/terms-conditions" className="hover:text-primary hover:underline">
          Terms
        </NextLink>
      </div>
    </footer>
  );
}
