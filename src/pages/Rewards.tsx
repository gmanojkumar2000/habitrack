import { useAppContext } from '../context/AppContext';
import { Navigate } from 'react-router-dom';
import { Award, Flame, Gift, Star, Target } from 'lucide-react';
import { calculateCurrentStreak, calculateUserPoints, getNextStreakMilestone } from '../utils/progress';
import { displayRewardIcon } from '../utils/rewards';

function Rewards() {
  const { currentUser, dailyEntries, adHocEntries, rewardTemplates } = useAppContext();

  if (!currentUser) return <Navigate to="/" />;

  const { lifetimePoints, currentPoints } = calculateUserPoints(currentUser.id, dailyEntries, adHocEntries);
  const currentStreak = calculateCurrentStreak(currentUser.id, dailyEntries);
  const nextMilestone = getNextStreakMilestone(currentStreak);
  const streakPercent = Math.min(100, Math.round((currentStreak / nextMilestone) * 100));
  const daysToMilestone = nextMilestone - currentStreak;
  const availableRewards = rewardTemplates.filter((reward) =>
    reward.isActive && (reward.userId === currentUser.id || reward.userId === 'global')
  );
  const readyToClaim = availableRewards.filter((reward) => currentPoints >= reward.cost);
  const workingTowards = availableRewards.filter((reward) => currentPoints < reward.cost);

  return (
    <div className="container animate-slide-up" style={{ paddingBottom: '100px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary-dark)' }}>Rewards</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="glass-panel animate-pop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.25rem 1rem' }}>
          <Star color="var(--warning)" size={32} fill="var(--warning)" />
          <h2 style={{ margin: '0.5rem 0 0.2rem', color: 'var(--warning)' }}>{currentPoints}</h2>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>Available to Spend</p>
        </div>
        <div className="glass-panel animate-pop" style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.25rem 1rem' }}>
          <Award color="var(--primary)" size={32} />
          <h2 style={{ margin: '0.5rem 0 0.2rem', color: 'var(--primary)' }}>{lifetimePoints}</h2>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>Lifetime Earned</p>
        </div>
      </div>

      <div className="glass-panel animate-pop" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Flame size={20} color="#ef4444" /> Next Streak
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ width: '58px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card-bg)', borderRadius: '8px' }}>
            <Flame size={32} color="#ef4444" fill="#ef4444" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.25rem 0' }}>{currentStreak} day streak</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {daysToMilestone === 1 ? 'One more day' : `${daysToMilestone} more days`} to reach {nextMilestone}.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
          <span>Progress to streak milestone</span>
          <span>{currentStreak} / {nextMilestone}</span>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.1)', height: '12px', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{
            background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
            width: `${streakPercent}%`,
            height: '100%',
            transition: 'width 1s ease-out'
          }} />
        </div>
      </div>

      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Gift size={20} color="var(--secondary)" /> Point Rewards
      </h3>

      {availableRewards.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>No point rewards have been added yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {readyToClaim.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--success)' }}>Ready to Claim</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {readyToClaim.map((reward, index) => (
                  <div key={reward.id} className="glass-panel animate-slide-up" style={{ animationDelay: `${index * 0.1}s`, border: '2px solid var(--success-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontSize: '2rem', width: '54px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card-bg)', borderRadius: '8px' }}>
                        {displayRewardIcon(reward.icon, reward.title)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.25rem 0' }}>{reward.title}</h3>
                        <div className="points-badge" style={{ display: 'inline-flex', background: 'var(--success-light)', color: 'white' }}>
                          {reward.cost} pts
                        </div>
                      </div>
                    </div>
                    <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: 'var(--success)', textAlign: 'center', fontWeight: 'bold' }}>
                      You earned this. Ask your parent to redeem it.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {workingTowards.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Working Toward</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {workingTowards.map((reward, index) => {
                  const percent = reward.cost <= 0 ? 100 : Math.min(100, Math.round((currentPoints / reward.cost) * 100));
                  const remaining = Math.max(0, reward.cost - currentPoints);

                  return (
                    <div key={reward.id} className="glass-panel animate-slide-up" style={{ animationDelay: `${index * 0.1 + 0.2}s` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '2rem', width: '54px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card-bg)', borderRadius: '8px', opacity: 0.75 }}>
                          {displayRewardIcon(reward.icon, reward.title)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 0.25rem 0' }}>{reward.title}</h3>
                          <div className="points-badge" style={{ display: 'inline-flex', background: 'var(--card-bg)', color: 'var(--text-main)' }}>
                            {remaining} pts to go
                          </div>
                        </div>
                        <Target size={22} color="var(--primary)" />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                        <span>{currentPoints} / {reward.cost} pts</span>
                        <span>{percent}%</span>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.1)', height: '12px', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{
                          background: 'var(--primary)',
                          width: `${percent}%`,
                          height: '100%',
                          transition: 'width 1s ease-out'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Rewards;
