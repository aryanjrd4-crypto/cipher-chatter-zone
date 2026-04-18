import { ReactNode, useEffect, useState } from 'react';
import { Header } from './Header';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  wide?: boolean;
  rightRail?: ReactNode;
}

export function Layout({ children, wide, rightRail }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut: N → new post
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target?.tagName?.toLowerCase();
      const editing = tag === 'input' || tag === 'textarea' || target?.isContentEditable;
      if (editing) return;
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        navigate('/create');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background bg-mesh flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-72 xl:w-80 shrink-0 border-r border-border/40 sticky top-0 h-screen">
        <AppSidebar />
      </div>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[300px] bg-sidebar border-r border-border/40">
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-w-0 flex flex-col">
        <Header onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 w-full">
          <div className={`mx-auto px-4 py-6 ${wide ? 'max-w-6xl' : 'max-w-3xl'} ${rightRail ? 'lg:flex lg:gap-6 lg:max-w-6xl' : ''}`}>
            <div className={rightRail ? 'flex-1 min-w-0' : ''}>{children}</div>
            {rightRail && (
              <aside className="hidden lg:block w-72 shrink-0">
                <div className="sticky top-20 space-y-4">{rightRail}</div>
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
