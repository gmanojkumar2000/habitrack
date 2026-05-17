import { useAppContext } from '../context/AppContext';
import { LayoutDashboard } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import HabitHistoryDashboard from '../components/HabitHistoryDashboard';

function Dashboard() {
  const { currentUser, dailyEntries, habitTemplates, adHocEntries } = useAppContext();

  if (!currentUser) return <Navigate to="/" />;

  const activeHabits = habitTemplates.filter((template) => template.userId === currentUser.id && template.isActive);

  return (
    <div className="container animate-slide-up" style={{ paddingBottom: '100px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary-dark)' }}>Dashboard</h1>

      <div className="glass-panel animate-slide-up" style={{ animationDelay: '0.1s', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LayoutDashboard size={20} color="var(--primary)" /> Habit History
        </h3>
        <HabitHistoryDashboard
          userId={currentUser.id}
          habits={activeHabits}
          dailyEntries={dailyEntries}
          adHocEntries={adHocEntries}
        />
      </div>
    </div>
  );
}

export default Dashboard;
