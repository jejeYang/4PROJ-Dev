import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Home from './pages/home';
import Login from './pages/login';
import Register from './pages/register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Settings from './pages/Settings';
import logo from './assets/logo.png';
import { ThemeProvider } from './context/theme_context';
import FallingIcons from './components/FallingIcons';
import Partage from './pages/Partage';

axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.warn("Token expiré ou invalide. Déconnexion automatique.");
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

function AppContent() {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  
  const initialAuth = !!(token && user);
  const initialUsername = user ? (user.nom || user.email || 'User') : '';
  const initialAvatarUrl = user ? user.avatarUrl : null; 

  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth);
  const [username, setUsername] = useState(initialUsername);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUserString = localStorage.getItem('user');
      
      if (updatedUserString) {
        const updatedUser = JSON.parse(updatedUserString);
        
        setUsername(updatedUser.nom || updatedUser.email || 'User');
        setAvatarUrl(updatedUser.avatarUrl || null);
      }
    };

    handleStorageChange();

    window.addEventListener('profilMisAJour', handleStorageChange);

    return () => {
      window.removeEventListener('profilMisAJour', handleStorageChange);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUsername('');
    setAvatarUrl(null);
    window.location.href = '/';
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isHome = location.pathname === '/';

  return (
    <div className="app-container">
      {isHome && (<FallingIcons />)}
      
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <img src={logo} alt="SupFile Logo" className="nav-logo" />
        </Link>
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <div className="nav-user-info">
                  {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="nav-avatar-img" />
                  ) : (
                      <div className="nav-avatar-initiale">
                          {username.charAt(0).toUpperCase()}
                      </div>
                  )}
                  <span className="nav-username">{username}</span>
              </div>
              <button onClick={handleLogout} className="nav-link logout-btn">Logout</button>
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
        {isAuthenticated && !isAuthPage && !isHome && (
          <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-content">
              <h3>Menu</h3>
              <Link to="/dashboard" className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                Tableau de bord
              </Link>
              <Link to="/upload" className={`sidebar-link ${location.pathname === '/upload' ? 'active' : ''}`}>
                Uploader
              </Link>
              <Link to="/partages" className={`sidebar-link ${location.pathname === '/partages' ? 'active' : ''}`}>
                Partages
              </Link>
              <Link to="/settings" className={`sidebar-link ${location.pathname === '/settings' ? 'active' : ''}`}>
                Paramètres
              </Link>
            </div>
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
          </aside>
        )}
        
        <div className={`main-content ${isAuthenticated && !isAuthPage && !isHome ? 'with-sidebar' : ''} ${isAuthPage ? 'auth-page' : ''}`}>
          {isAuthenticated && !isAuthPage && !isHome && (
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
          )}
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Home />} />
            <Route path="/upload" element={isAuthenticated ? <Upload /> : <Home />} />
            <Route path="/settings" element={isAuthenticated ? <Settings /> : <Home />} />
            <Route path="/partages" element={<Partage />} />
          </Routes>
        </div>
      </div>

      <footer className="footer">
        Conditions d'utilisation | © 2026 SUPFile
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