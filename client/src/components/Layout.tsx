import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import '../styles/index.css';

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname.startsWith(path);
    };

    return (
        <div className="app-layout">
            <div className="app-content">
                <Outlet />
            </div>

            <nav className="bottom-nav">
                <button
                    className={`nav-item ${isActive('/projects') ? 'active' : ''}`}
                    onClick={() => navigate('/projects')}
                >
                    <span className="nav-icon">📋</span>
                    <span className="nav-label">Projects</span>
                </button>

                <button
                    className={`nav-item ${isActive('/portfolio') ? 'active' : ''}`}
                    onClick={() => navigate('/portfolio')}
                >
                    <span className="nav-icon">⭐</span>
                    <span className="nav-label">Portfolio</span>
                </button>

                <button
                    className={`nav-item ${isActive('/account') ? 'active' : ''}`}
                    onClick={() => navigate('/account')}
                >
                    <span className="nav-icon">👤</span>
                    <span className="nav-label">Account</span>
                </button>
            </nav>
        </div>
    );
}
