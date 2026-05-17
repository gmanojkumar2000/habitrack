import { useAppContext } from '../context/AppContext';
import type { ReactNode } from 'react';
import { Award, Flame, Star, Target, Trophy } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { calculateCurrentStreak, calculateUserPoints, getNextStreakMilestone } from '../utils/progress';

function Progress() {
  const { currentUser, dailyEntries, adHocEntries } = useAppContext();

  if (!currentUser) return <Navigate to="/" />;

  const { completedDaily, earnedAdHoc, lifetimePoints, currentPoints } = calculateUserPoints(
    currentUser.id,
    dailyEntries,
    adHocEntries
  );
  const habitsCompleted = completedDaily.length;
  const extraGoodDeeds = earnedAdHoc.length;
  const currentStreak = calculateCurrentStreak(currentUser.id, dailyEntries);
  const nextStreakMilestone = getNextStreakMilestone(currentStreak);
  const streakMessage = currentStreak === 0
    ? 'Complete one habit today to start.'
    : `${nextStreakMilestone - currentStreak} days to ${nextStreakMilestone}.`;

  const level = Math.floor(lifetimePoints / 100) + 1;
  const pointsToNextLevel = (level * 100) - lifetimePoints;
  const progressPercent = ((lifetimePoints % 100) / 100) * 100;

  return (
    <div className="container animate-slide-up" style={{ paddingBottom: '100px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary-dark)' }}>Your Progress</h1>

      <div className="glass-panel animate-pop" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', border: 'none', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Level {level}</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)' }}>{currentUser.name} {currentUser.avatar}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '50%' }}>
            <Trophy size={32} fill="white" />
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', height: '12px', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.5rem' }}>
          <div style={{ background: 'var(--warning-light)', width: `${progressPercent}%`, height: '100%', transition: 'width 1s ease-out' }} />
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', textAlign: 'right', color: 'rgba(255,255,255,0.9)' }}>
          {pointsToNextLevel} points to Level {level + 1}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon={<Star color="var(--warning)" size={32} fill="var(--warning)" />} value={currentPoints} label="Available Points" color="var(--warning)" delay="0.1s" />
        <StatCard icon={<Target color="var(--success)" size={32} />} value={habitsCompleted} label="Habits Done" color="var(--success)" delay="0.2s" />
        <StatCard icon={<Award color="var(--secondary)" size={32} />} value={extraGoodDeeds} label="Extra Deeds" color="var(--secondary)" delay="0.3s" />
        <StatCard icon={<Flame color="#ef4444" size={32} />} value={currentStreak} label="Day Streak" color="#ef4444" delay="0.4s" />
      </div>

      <div className="glass-panel animate-slide-up" style={{ animationDelay: '0.5s', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Flame size={20} color="#ef4444" /> Next Streak Goal
        </h3>
        <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{streakMessage}</p>
        <div style={{ background: 'rgba(0,0,0,0.1)', height: '12px', borderRadius: '10px', overflow: 'hidden' }}>
          <div
            style={{
              background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
              width: `${Math.min(100, Math.round((currentStreak / nextStreakMilestone) * 100))}%`,
              height: '100%',
              transition: 'width 1s ease-out'
            }}
          />
        </div>
      </div>

      <div className="glass-panel animate-slide-up" style={{ animationDelay: '0.6s' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trophy size={20} color="var(--primary)" /> Achievement Ideas
        </h3>
        <p style={{ fontSize: '0.9rem' }}>
          Add badges for perfect days, streak milestones, first redemption, and weekly quest finishes.
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: ReactNode;
  value: number;
  label: string;
  color: string;
  delay: string;
}

function StatCard({ icon, value, label, color, delay }: StatCardProps) {
  return (
    <div className="glass-panel animate-slide-up" style={{ animationDelay: delay, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.25rem 1rem' }}>
      {icon}
      <h2 style={{ margin: '0.5rem 0 0.2rem', color }}>{value}</h2>
      <p style={{ fontSize: '0.8rem', margin: 0 }}>{label}</p>
    </div>
  );
}

export default Progress;
