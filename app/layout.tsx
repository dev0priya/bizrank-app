import React, { Suspense } from 'react';
import './globals.css';
import type { Metadata } from 'next';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { Footer } from '../components/layout/Footer';

import { MobileMenuProvider } from '../context/MobileMenuContext';
import { ThemeProvider } from '../context/ThemeContext';

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
        <ThemeProvider>
          <MobileMenuProvider>
            <div className="app-container">
              <Suspense fallback={<div style={{ width: '78px', background: 'var(--panel-bg)' }} />}>
                <Sidebar />
              </Suspense>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <Topbar />
                <main className="main-content no-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1 }}>
                    {children}
                  </div>
                  <Footer />
                </main>
              </div>
            </div>
          </MobileMenuProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
