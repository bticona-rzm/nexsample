// src/pages/_app.tsx

import '../styles/input.css';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import type { Session } from 'next-auth';

// Añade el prop `session` a AppProps
function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps<{ session: Session }>) {
  return (
    // SessionProvider debe envolver todo
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;