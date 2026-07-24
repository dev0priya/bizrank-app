import './globals.css';
import type { Metadata } from 'next';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';

export const metadata: Metadata = {
  title: 'BizRank SaaS',
  description: 'Production-grade Business Discovery SaaS Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <Sidebar />
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Topbar />
            <main className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
