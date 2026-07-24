import React from 'react';
import Link from 'next/link';
import { Github, Linkedin, Mail, ExternalLink } from 'lucide-react';

export function Footer() {
  const devEmail = process.env.NEXT_PUBLIC_DEV_EMAIL || 'priya@example.com';
  const devGithub = process.env.NEXT_PUBLIC_DEV_GITHUB || 'https://github.com/priya';
  const devLinkedin = process.env.NEXT_PUBLIC_DEV_LINKEDIN || 'https://linkedin.com/in/priya';
  const devPortfolio = process.env.NEXT_PUBLIC_DEV_PORTFOLIO || 'https://priya.dev';

  return (
    <div style={{ marginTop: '64px', borderTop: '1px solid var(--border-color)', paddingTop: '40px', paddingBottom: '24px' }}>
      
      {/* About Section */}
      <div className="glass-panel" style={{ marginBottom: '40px', background: 'rgba(30, 41, 59, 0.4)' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>About BizRank</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '14px' }}>
          BizRank is a production-grade Business Discovery and Lead Intelligence Platform designed to automate the sourcing, enrichment, and qualification of B2B leads. Built with a modern, highly scalable technology stack, it seamlessly bridges the gap between raw web data and actionable CRM insights, empowering sales and marketing teams to discover high-value opportunities with precision and speed.
        </p>
      </div>

      {/* Main Footer Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '40px' }}>
        
        {/* Column 1: Brand */}
        <div>
          <div className="sidebar-logo" style={{ marginBottom: '16px', fontSize: '20px' }}>BizRank.</div>
          <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>
            AI Powered Business Discovery & Lead Intelligence Platform
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5 }}>
            Streamline your lead generation pipeline from initial discovery to final qualification.
          </p>
        </div>

        {/* Column 2: Platform */}
        <div>
          <h4 style={{ color: 'var(--text-main)', marginBottom: '16px', fontWeight: 600 }}>Platform</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <li><Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link></li>
            <li><Link href="/discovery" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Business Discovery</Link></li>
            <li><Link href="/jobs" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Collection Jobs</Link></li>
            <li><Link href="/database" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Business Database</Link></li>
            <li><Link href="/leads" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Qualified Leads</Link></li>
            <li><Link href="/crm" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>CRM</Link></li>
            <li><Link href="/analytics" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Analytics</Link></li>
          </ul>
        </div>

        {/* Column 3: Technology */}
        <div>
          <h4 style={{ color: 'var(--text-main)', marginBottom: '16px', fontWeight: 600 }}>Technology</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <li style={{ color: 'var(--text-muted)' }}>Next.js</li>
            <li style={{ color: 'var(--text-muted)' }}>React</li>
            <li style={{ color: 'var(--text-muted)' }}>TypeScript</li>
            <li style={{ color: 'var(--text-muted)' }}>Tailwind CSS / Vanilla CSS</li>
            <li style={{ color: 'var(--text-muted)' }}>Prisma ORM</li>
            <li style={{ color: 'var(--text-muted)' }}>PostgreSQL (Neon)</li>
            <li style={{ color: 'var(--text-muted)' }}>Apify</li>
            <li style={{ color: 'var(--text-muted)' }}>Vercel</li>
          </ul>
        </div>

        {/* Column 4: Developer */}
        <div>
          <h4 style={{ color: 'var(--text-main)', marginBottom: '16px', fontWeight: 600 }}>Developer</h4>
          <p style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '14px' }}>Priya</p>
          <p style={{ color: 'var(--accent-primary)', fontSize: '12px', marginBottom: '8px' }}>Full Stack Developer</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '16px' }}>
            "I build scalable SaaS platforms, AI-powered applications, modern web experiences, and cloud-native software."
          </p>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href={`mailto:${devEmail}`} title="Email" style={{ color: 'var(--text-muted)' }}>
              <Mail size={18} />
            </a>
            <a href={devGithub} target="_blank" rel="noreferrer" title="GitHub" style={{ color: 'var(--text-muted)' }}>
              <Github size={18} />
            </a>
            <a href={devLinkedin} target="_blank" rel="noreferrer" title="LinkedIn" style={{ color: 'var(--text-muted)' }}>
              <Linkedin size={18} />
            </a>
            <a href={devPortfolio} target="_blank" rel="noreferrer" title="Portfolio" style={{ color: 'var(--text-muted)' }}>
              <ExternalLink size={18} />
            </a>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
          &copy; 2026 Priya. All Rights Reserved.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
          Designed & Developed by <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Priya</span>.
        </p>
      </div>

    </div>
  );
}
