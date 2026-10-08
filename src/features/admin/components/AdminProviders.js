'use client';

import { ThemeProvider } from '@gravity-ui/uikit';

// Gravity UI শুধু অ্যাডমিন অংশে (scoped) — স্টোরফ্রন্টের HeroUI-র সাথে মিশে যায় না
export default function AdminProviders({ children }) {
  return (
    <ThemeProvider theme="light" scoped rootClassName="admin-scope">
      {children}
    </ThemeProvider>
  );
}
