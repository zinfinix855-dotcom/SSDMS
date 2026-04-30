import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  // Don't show on dashboard
  if (location.pathname === '/' || location.pathname === '/dashboard') return null;

  return (
    <nav className="breadcrumb-container animate-fade-in" aria-label="breadcrumb">
      <div className="d-flex align-items-center">
        <div className="breadcrumb-item d-flex align-items-center">
          <Link to="/dashboard" className="d-flex align-items-center gap-1">
            <Home size={14} />
            DASHBOARD
          </Link>
        </div>
        
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;

          return (
            <div key={to} className="d-flex align-items-center">
              <span className="breadcrumb-separator">
                <ChevronRight size={14} />
              </span>
              <div className={`breadcrumb-item ${last ? 'active' : ''}`}>
                {last ? (
                  value.replace(/-/g, ' ').toUpperCase()
                ) : (
                  <Link to={to}>{value.replace(/-/g, ' ').toUpperCase()}</Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
