'use client';

import { useEffect, useState } from 'react';
import NextLink from 'next/link';

export default function NotificationBar({ notification }) {
  const [hidden, setHidden] = useState(false);
  const key = notification ? `notif-dismissed:${notification.id}:${notification.version}` : null;

  useEffect(() => {
    if (!key) return;
    try {
      if (localStorage.getItem(key)) setHidden(true);
    } catch {}
  }, [key]);

  if (!notification || hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(key, '1');
    } catch {}
  };

  return (
    <div className="relative bg-primary px-10 py-2 text-center text-sm text-primary-foreground" role="status">
      <span>{notification.message}</span>
      {notification.linkUrl && (
        <NextLink href={notification.linkUrl} className="ml-2 font-semibold underline underline-offset-2">
          {notification.linkLabel || 'Learn more'}
        </NextLink>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-lg leading-none hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        ×
      </button>
    </div>
  );
}
