import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioLines, LogIn, UserPlus, Brain, Info, LayoutDashboard, LogOut, Github } from 'lucide-react';

// Components
import WelcomePage from './components/WelcomePage';
import Auth from './components/Auth';
import AboutUs from './components/AboutUs';
import ModelsPage from './components/ModelsPage';

const App = () => {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Load user from localstorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('vaniverse_user');
      if (savedUser && savedUser !== 'undefined') {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Failed to parse user from localstorage", e);
      localStorage.removeItem('vaniverse_user');
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('vaniverse_user', JSON.stringify(userData));
    navigate('/dashboard/models');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vaniverse_user');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  // Protected Route Wrapper
  const ProtectedRoute = ({ children }) => {
    if (checkingAuth) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-vpurple-light">Loading Universe...</div>;
    if (!user) return <Navigate to="/dashboard/signup" state={{ from: location }} replace />;
    return children;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-vpurple/30">
      <Routes>
        {/* Welcome Page */}
        <Route path="/" element={<WelcomePage />} />

        {/* Dashboard Layout */}
        <Route path="/dashboard/*" element={
          <div className="min-h-screen flex flex-col">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 px-6 py-4 flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="p-2 bg-vpurple rounded-xl group-hover:scale-110 transition-transform">
                  <AudioLines size={24} className="text-white" />
                </div>
                <span className="text-xl font-black text-white tracking-tighter">VANIVERSE AI</span>
              </Link>

              <div className="hidden md:flex items-center space-x-1 bg-slate-900/50 p-1 rounded-2xl border border-white/5">
                <NavLink to="/dashboard/models" icon={Brain} label="Models" active={location.pathname.startsWith('/dashboard/models')} />
                <NavLink to="/dashboard/about" icon={Info} label="About Us" active={isActive('/dashboard/about')} />
                {!user ? (
                  <>
                    <NavLink to="/dashboard/login" icon={LogIn} label="Login" active={isActive('/dashboard/login')} />
                    <NavLink to="/dashboard/signup" icon={UserPlus} label="Sign Up" active={isActive('/dashboard/signup')} />
                  </>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm font-bold"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {user && (
                  <div className="hidden sm:flex items-center space-x-3 pr-4 border-r border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-vpurple to-vpink flex items-center justify-center text-xs font-black text-white">
                      {user.username[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-400 capitalize">{user.username}</span>
                  </div>
                )}
                <a href="#" className="p-2 hover:bg-slate-900 rounded-lg transition-colors">
                  <Github size={20} className="text-slate-500 hover:text-white" />
                </a>
              </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
              <Routes>
                <Route index element={<Navigate to="models" replace />} />
                <Route path="models" element={<ProtectedRoute><ModelsPage /></ProtectedRoute>} />
                <Route path="about" element={<AboutUs />} />
                <Route path="login" element={<Auth mode="login" onAuthSuccess={handleAuthSuccess} />} />
                <Route path="signup" element={<Auth mode="signup" onAuthSuccess={handleAuthSuccess} />} />
              </Routes>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center border-t border-slate-900">
              <p className="text-slate-600 text-xs font-medium tracking-widest uppercase">
                Vaniverse AI • Experimental Audio Intelligence • 2026
              </p>
            </footer>
          </div>
        } />
      </Routes>
    </div>
  );
};

const NavLink = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={`px-4 py-2 rounded-xl flex items-center space-x-2 text-sm font-bold transition-all duration-300 ${active ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}
  >
    <Icon size={16} />
    <span>{label}</span>
  </Link>
);

export default App;
