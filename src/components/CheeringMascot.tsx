import React from 'react';
import { useMascot } from '../context/useMascot';
import tyroImage from '../assets/tyro-mascot.png';
import { Star, Flame, AlertCircle, PartyPopper } from 'lucide-react';

const CheeringMascot: React.FC = () => {
  const { isVisible, title, message, type, isCheering, dismissCheer } = useMascot();

  const renderIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertCircle size={20} color="var(--warning)" style={{ minWidth: '20px' }} />;
      case 'streak':
        return <Flame size={20} color="#ef4444" style={{ minWidth: '20px' }} fill="#ef4444" />;
      case 'party':
        return <PartyPopper size={20} color="var(--secondary)" style={{ minWidth: '20px' }} />;
      case 'success':
      default:
        return <Star size={20} color="var(--primary)" style={{ minWidth: '20px' }} fill="var(--primary)" />;
    }
  };

  const getBubbleBorderColor = () => {
    switch (type) {
      case 'warning':
        return 'var(--warning)';
      case 'streak':
        return '#ef4444';
      case 'party':
        return 'var(--secondary)';
      case 'success':
      default:
        return 'var(--primary-light)';
    }
  };

  return (
    <div className={`tyro-mascot-container ${isVisible ? 'active' : 'inactive'}`}>
      {isVisible && (
        <div 
          className="tyro-speech-bubble animate-pop"
          style={{ borderColor: getBubbleBorderColor() }}
          onClick={dismissCheer}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
            {renderIcon()}
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{title}</strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-muted)' }}>
            {message}
          </p>
        </div>
      )}

      <div 
        className="tyro-character-wrapper" 
        onClick={dismissCheer}
        title="Click to dismiss Tyro!"
      >
        <div className="tyro-exhaust-sparkle" />
        <img 
          src={tyroImage} 
          alt="Tyro the Gear-Saurus Mascot" 
          className={`tyro-character ${isCheering ? 'cheering' : 'idle'}`}
        />
      </div>
    </div>
  );
};

export default CheeringMascot;
