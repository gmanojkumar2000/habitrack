import { Award } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import BadgeMedallion from '../components/BadgeMedallion';
import { useAppContext } from '../context/AppContext';
import { badgeDefinitions } from '../utils/badges';

function Badges() {
  const { currentUser, earnedBadges } = useAppContext();

  if (!currentUser) return <Navigate to="/" />;

  const earnedBadgeIds = new Set(
    earnedBadges.filter((badge) => badge.userId === currentUser.id).map((badge) => badge.badgeId)
  );
  const badgeGroups = [...new Set(badgeDefinitions.map((badge) => badge.group))];

  return (
    <div className="container animate-slide-up" style={{ paddingBottom: '100px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--primary-dark)' }}>
        Badges
      </h1>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-muted)' }}>
        Keep building great habits and collect them all.
      </p>

      <div className="glass-panel badge-collection">
        <div className="badge-collection-summary">
          <strong>
            <Award size={20} color="var(--primary)" /> {earnedBadgeIds.size} of {badgeDefinitions.length} earned
          </strong>
          <span>Every steady step unlocks something new.</span>
        </div>

        {badgeGroups.map((group) => (
          <section key={group} className="badge-group">
            <h4>{group}</h4>
            <div className="badge-grid">
              {badgeDefinitions.filter((badge) => badge.group === group).map((badge) => {
                const earned = earnedBadgeIds.has(badge.id);
                return (
                  <article key={badge.id} className={`badge-card ${earned ? 'earned' : 'locked'}`}>
                    <BadgeMedallion badge={badge} earned={earned} />
                    <strong>{badge.name}</strong>
                    <span>{badge.description}</span>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default Badges;
