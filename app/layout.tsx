import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BizRank CRM',
  description: 'Ultimate Lead Management Platform',
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
          <nav className="sidebar">
            <div className="sidebar-logo">BizRank.</div>
            
            <Link href="/" className="nav-link">
              Dashboard
            </Link>
            <Link href="/pipeline" className="nav-link">
              Pipeline (Kanban)
            </Link>
            <Link href="/clients" className="nav-link">
              Client Directory
            </Link>
            
            <div style={{ marginTop: 'auto', padding: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
              BizRank CRM v2.0 <br/>
              Production Ready
            </div>
          </nav>
          
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
