'use client';

import { Search, Bell } from 'lucide-react';
import { useState } from 'react';

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="topbar glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', background: 'rgba(15, 23, 42, 0.9)' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--panel-bg)', borderRadius: '8px', padding: '8px 16px', border: '1px solid var(--border-color)', width: '400px' }}>
        <Search size={20} color="var(--text-muted)" style={{ marginRight: '8px' }} />
        <input 
          type="text" 
          placeholder="Global search across BizRank..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', position: 'relative' }}>
          <Bell size={24} />
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--status-lost)', width: '8px', height: '8px', borderRadius: '50%' }}></span>
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            A
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>Admin User</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Workspace Owner</div>
          </div>
        </div>
      </div>
    </header>
  );
}
