import type { BadgeDefinition } from '../utils/badges';

interface BadgeMedallionProps {
  badge: BadgeDefinition;
  earned?: boolean;
  size?: 'small' | 'large';
}

function BadgeMedallion({ badge, earned = true, size = 'small' }: BadgeMedallionProps) {
  return (
    <div
      className={`badge-medallion ${size === 'large' ? 'badge-medallion-large' : ''} ${earned ? '' : 'locked'}`}
      style={{
        '--badge-start': badge.colors[0],
        '--badge-end': badge.colors[1]
      } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="badge-medallion-ring">
        <div className="badge-medallion-face">
          <span>{badge.icon}</span>
        </div>
      </div>
      <div className="badge-medallion-ribbon" />
    </div>
  );
}

export default BadgeMedallion;
