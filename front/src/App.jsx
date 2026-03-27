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

axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
      // Redirection (token expiré ou invalide)
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
  const user = localStorage.getItem('user');
  const initialAuth = !!(token && user);
  const initialUsername = user ? (JSON.parse(user).nom || JSON.parse(user).email || 'User') : '';
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth);
  const [username, setUsername] = useState(initialUsername);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUsername('');
    window.location.href = '/';
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isHome = location.pathname === '/';

  return (
    <div className="app-container">
      <FallingIcons />
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <img src={logo} alt="SupFile Logo" className="nav-logo" />
        </Link>
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <span className="nav-username">{username}</span>
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