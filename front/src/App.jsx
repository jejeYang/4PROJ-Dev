import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './app.css';
import Home from './pages/home';
import Login from './pages/login';
import Register from './pages/register';
import logo from './assets/logo.png';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <Link to="/" className="nav-brand">
            <img src={logo} alt="SupFile Logo" className="nav-logo" />
            SUPFile
          </Link>
          <div className="nav-links">
            <Link to="/register" className="nav-link">Register</Link>
            <Link to="/login" className="nav-link">Login</Link>
          </div>
        </nav>

        <div className="main-content">
          <div className="background-pattern"></div>
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>

        <footer className="footer">
          Conditions d'utilisation
        </footer>
      </div>
    </Router>
  );
}

export default App;