import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Home from './pages/home';
import Login from './pages/login';
import Register from './pages/register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Settings from './pages/Settings';
import Partage from './pages/Partage';
import Lien from './pages/Lien';
import Conditions from './pages/Conditions';
import logo from './assets/logo.png';
import { ThemeProvider } from './context/theme_context';
import FallingIcons from './components/FallingIcons';

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            if (window.location.pathname.startsWith('/lien/')) {
                return Promise.reject(error);
            }
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            window.dispatchEvent(new Event('forceLogout'));
        }
        return Promise.reject(error);
    }
);

const formatOctets = (bytes) => {
    if (!bytes || bytes === 0) return '0 o';
    const k = 1024;
    const sizes = ['o', 'Ko', 'Mo', 'Go', 'To'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

function AppContent() {
    const navigate = useNavigate();
    const location = useLocation();

    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [erreurImage, setErreurImage] = useState(false);
    const [stockageUtilise, setStockageUtilise] = useState(0);

    const MAX_STORAGE = 30 * 1024 * 1024 * 1024;

    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    const isHome = location.pathname === '/';
    const isLienPartage = location.pathname.startsWith('/lien/');
    const isConditions = location.pathname === '/conditions';

    const performLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUsername('');
        setAvatarUrl(null);
        if (location.pathname !== '/login' && location.pathname !== '/') {
            navigate('/login');
        }
    };

    useEffect(() => {
        const handleStorageChange = () => {
            const token = localStorage.getItem('token');
            const userString = localStorage.getItem('user');
            
            setIsAuthenticated(!!token);

            if (userString) {
                const user = JSON.parse(userString);
                setUsername(user.nom || user.email || 'User');
                setAvatarUrl(user.avatarUrl || null);
                setErreurImage(false);
            }
        };

        handleStorageChange();
        
        window.addEventListener('profilMisAJour', handleStorageChange);
        return () => window.removeEventListener('profilMisAJour', handleStorageChange);
    }, [location.pathname]);

    useEffect(() => {
        const handleForceLogout = () => {
            performLogout();
        };

        window.addEventListener('forceLogout', handleForceLogout);
        return () => window.removeEventListener('forceLogout', handleForceLogout);
    }, [location.pathname]);

    useEffect(() => {
        if (isAuthenticated) {
            axios.get('http://localhost:3000/api/dossiers/stats/home', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            .then(response => {
                setStockageUtilise(response.data.stockage.utilise || 0);
            })
            .catch(error => console.error(error));
        }
    }, [isAuthenticated, location.pathname]);

    return (
        <div className="app-container">
            {(isHome || isAuthPage) && (<FallingIcons />)}
            
            <nav className="navbar">
                <Link to="/" className="nav-brand">
                    <img src={logo} alt="SupFile Logo" className="nav-logo" />
                </Link>
                <div className="nav-links">
                    {isAuthenticated ? (
                        <>
                            <div className="nav-user-info">
                                {avatarUrl && !erreurImage ? (
                                    <img 
                                        src={avatarUrl} 
                                        alt="Avatar" 
                                        className="nav-avatar-img" 
                                        onError={() => setErreurImage(true)} 
                                    />
                                ) : (
                                    <div className="nav-avatar-initiale">
                                        {username ? username.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                )}
                                <span className="nav-username">{username}</span>
                            </div>
                            <button onClick={performLogout} className="nav-link logout-btn">Déconnexion</button>
                        </>
                    ) : (
                        <>
                            <Link to="/register" className="nav-link">Créer un compte</Link>
                            <Link to="/login" className="nav-link">Connexion</Link>
                        </>
                    )}
                </div>
            </nav>

            <div className="app-wrapper">
                {isAuthenticated && !isAuthPage && !isHome && !isLienPartage && !isConditions && (
                    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                        <div className="sidebar-content">
                            <h3>Menu</h3>
                            <Link to="/dashboard" className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Tableau de bord</Link>
                            <Link to="/upload" className={`sidebar-link ${location.pathname === '/upload' ? 'active' : ''}`}>Uploader</Link>
                            <Link to="/partages" className={`sidebar-link ${location.pathname === '/partages' ? 'active' : ''}`}>Partages</Link>
                            <Link to="/settings" className={`sidebar-link ${location.pathname === '/settings' ? 'active' : ''}`}>Paramètres</Link>
                        </div>
                        <div className="sidebar-storage">
                            <div className="storage-bar">
                                <div className="storage-fill" style={{ width: `${Math.min((stockageUtilise / MAX_STORAGE) * 100, 100)}%` }}></div>
                            </div>
                            <p className="storage-text">{formatOctets(stockageUtilise)} utilisé</p>
                        </div>
                        <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
                    </aside>
                )}
                
                <div className={`main-content ${isAuthenticated && !isAuthPage && !isHome && !isLienPartage && !isConditions ? 'with-sidebar' : ''} ${isAuthPage ? 'auth-page' : ''}`}>
                    {isAuthenticated && !isAuthPage && !isHome && !isLienPartage && !isConditions && (
                        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
                    )}
                    
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Home />} />
                        <Route path="/upload" element={isAuthenticated ? <Upload /> : <Home />} />
                        <Route path="/settings" element={isAuthenticated ? <Settings /> : <Home />} />
                        <Route path="/partages" element={<Partage />} />
                        <Route path="/lien/:token" element={<Lien />} />
                        <Route path="/conditions" element={<Conditions />} />
                    </Routes>
                </div>
            </div>

            <footer className="footer">
                <Link to="/conditions" className="footer-link">Conditions d'utilisation</Link> | © 2026 SUPFile
            </footer>
        </div>
    );
}

function App() {
    return (
        <ThemeProvider>
            <Router>
                <AppContent />
            </Router>
        </ThemeProvider>
    );
}

export default App;