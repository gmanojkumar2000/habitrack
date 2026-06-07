import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { CheckSquare, Trophy } from 'lucide-react';
import { AppProvider, useAppContext } from './context/AppContext';
import ProfileSelection from './pages/ProfileSelection';
import Loading from './pages/Loading';
import DailyTracker from './pages/DailyTracker';
import Progress from './pages/Progress';
import ParentMode from './pages/ParentMode';
import Rewards from './pages/Rewards';
import Dashboard from './pages/Dashboard';
import { useDemerits } from './hooks/useDemerits';
import { Gift, LayoutDashboard } from 'lucide-react';
import { MascotProvider } from './context/MascotContext';
import CheeringMascot from './components/CheeringMascot';

const BottomNav = () => {
  const location = useLocation();
  const { currentUser } = useAppContext();
  
  // Hide nav on profile selection screen
  if (!currentUser || location.pathname === '/') return null;
  // Hide nav on parent mode if preferred, but keeping it helps exit
  
  return (
    <nav className="bottom-nav">
      <Link to="/today" className={`nav-item ${location.pathname === '/today' ? 'active' : ''}`}>
        <CheckSquare />
        <span>Today</span>
      </Link>
      <Link to="/progress" className={`nav-item ${location.pathname === '/progress' ? 'active' : ''}`}>
        <Trophy />
        <span>Progress</span>
      </Link>
      <Link to="/rewards" className={`nav-item ${location.pathname === '/rewards' ? 'active' : ''}`}>
        <Gift />
        <span>Rewards</span>
      </Link>
      <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
        <LayoutDashboard />
        <span>Dashboard</span>
      </Link>
    </nav>
  );
};

const AppRoutes = () => {
  useDemerits();
  const { currentUser } = useAppContext();
  const showMascot = currentUser?.mascotEnabled !== false;

  return (
    <>
      <Routes>
        <Route path="/" element={<ProfileSelection />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/today" element={<DailyTracker />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/parent" element={<ParentMode />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      {showMascot && <CheeringMascot />}
    </>
  );
};

function App() {
  return (
    <AppProvider>
      <MascotProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </MascotProvider>
    </AppProvider>
  );
}

export default App;
