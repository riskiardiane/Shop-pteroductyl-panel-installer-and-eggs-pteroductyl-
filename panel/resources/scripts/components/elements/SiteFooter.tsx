import React from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import Attribution from '@blueprint/extends/Attribution';

/**
 * Footer kecil di bawah setiap halaman SPA. Teks bisa diatur admin
 * (Admin → Settings → Web → Footer Text); default "© {year} RizzDevs".
 */
export default () => {
  const footer = useStoreState((state: ApplicationStore) => state.settings.data?.footer ?? null);

  if (footer) {
    return (
      <span className={'no-underline'} style={{ color: 'var(--pn-text-muted)' }}>
        {footer}
      </span>
    );
  }

  return (
    <>
      &copy; {new Date().getFullYear()}{' '}
      <a href={'mailto:animersvercel@gmail.com'} className={'no-underline'} style={{ color: 'var(--pn-text-muted)' }}>
        RizzDevs
      </a>
      <Attribution />
    </>
  );
};
