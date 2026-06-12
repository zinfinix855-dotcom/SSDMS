import { useState } from 'react';
import ZenithSidebar from './ZenithSidebar';
import ZenithHeader from './ZenithHeader';

export default function Layout({ children, title }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="zenith-app">
            <ZenithSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            
            <main className="zenith-main" style={{ marginLeft: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)' }}>
                <ZenithHeader title={title} />
                
                <div className="p-8 animate-slide-in">
                    <div className="zenith-container">
                        {children}
                    </div>
                </div>
            </main>

            <style>{`
                .p-8 { padding: 2rem 2.5rem; }
            `}</style>
        </div>
    );
}
