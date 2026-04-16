import { ReactNode } from 'react';
import { Header } from './Header';

export function Layout({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-background bg-mesh">
      <Header />
      <main className={`container mx-auto px-4 py-6 ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}>
        {children}
      </main>
    </div>
  );
}
