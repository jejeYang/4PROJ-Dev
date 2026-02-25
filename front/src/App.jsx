import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Settings from './pages/Settings';
import logo from './assets/logo.png';
import { ThemeProvider } from './context/theme_context';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
      const userData = JSON.parse(user);
      setUsername(userData.nom || userData.email || 'User');
    }
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
                📊 Tableau de bord
              </Link>
              <Link to="/upload" className={`sidebar-link ${location.pathname === '/upload' ? 'active' : ''}`}>
                📤 Uploader
              </Link>
              <Link to="/settings" className={`sidebar-link ${location.pathname === '/settings' ? 'active' : ''}`}>
                ⚙️ Paramètres
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