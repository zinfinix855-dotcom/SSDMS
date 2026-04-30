import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Breadcrumbs from './common/Breadcrumbs';

export default function Layout({ children, title }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="d-flex">
            <Sidebar 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen} 
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />
            <div className={`ssdms-main ${isSidebarOpen ? 'shifted' : ''} ${isCollapsed ? 'collapsed' : ''}`} style={{ marginLeft: isCollapsed ? '80px' : '200px' }}>
                <Topbar 
                    title={title} 
                    onToggleMobile={() => setIsSidebarOpen(!isSidebarOpen)} 
                    onToggleDesktop={() => setIsCollapsed(!isCollapsed)}
                />
                <div className="p-2 animate-fade-in">
                    <Breadcrumbs />
                    {children}
                </div>
            </div>
        </div>
    );
}
