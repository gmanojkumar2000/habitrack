import { X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getBadgeDefinition, shouldShowBadgeCelebration } from '../utils/badges';
import BadgeMedallion from './BadgeMedallion';

function BadgeCelebration() {
  const { badgeCelebration, dismissBadgeCelebration, users, currentUser } = useAppContext();
  const location = useLocation();

  if (!badgeCelebration) return null;
  if (!shouldShowBadgeCelebration(location.pathname, currentUser?.id, badgeCelebration.userId)) return null;

  const badge = getBadgeDefinition(badgeCelebration.badgeId);
  if (!badge) return null;

  const childName = users.find((user) => user.id === badgeCelebration.userId)?.name;

  return (
    <div className="badge-celebration-overlay" role="dialog" aria-modal="true" aria-labelledby="badge-title">
      <button
        type="button"
        className="badge-celebration-close"
        aria-label="Close badge celebration"
        onClick={() => void dismissBadgeCelebration()}
      >
        <X size={26} />
      </button>

      <div className="badge-confetti badge-confetti-one" />
      <div className="badge-confetti badge-confetti-two" />
      <div className="badge-confetti badge-confetti-three" />

      <div className="badge-celebration-card animate-pop">
        <span className="badge-celebration-kicker">New badge earned</span>
        <BadgeMedallion badge={badge} size="large" />
        <h1 id="badge-title">{badge.name}</h1>
        <p className="badge-celebration-congrats">
          Congratulations{childName ? `, ${childName}` : ''}!
        </p>
        <p>{badge.description}</p>
        <button type="button" className="btn btn-primary" onClick={() => void dismissBadgeCelebration()}>
          Keep Going
        </button>
      </div>
    </div>
  );
}

export default BadgeCelebration;
