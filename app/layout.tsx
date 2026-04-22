import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Airtel SCM Assistant',
  description: 'AI-powered support for Icertis Contract Management and Oracle Fusion ERP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'dark:bg-gray-800 dark:text-white',
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}
