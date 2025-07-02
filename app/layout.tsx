import './globals.css';
import { ReactNode } from 'react';
import AuthProvider from '../components/AuthProvider';
import Nav from '../components/Nav';
import ThemeToggle from '../components/ThemeToggle';

export const metadata = {
  title: 'Inventory App',
  description: 'Inventory management with Supabase',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <AuthProvider>
          <Nav />
          <div className="max-w-3xl mx-auto p-4">
            {children}
            <ThemeToggle />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
