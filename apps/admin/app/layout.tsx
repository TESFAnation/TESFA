import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TESFA | Review Dashboard',
  description: 'Private campaign review dashboard for the TESFA prototype.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
