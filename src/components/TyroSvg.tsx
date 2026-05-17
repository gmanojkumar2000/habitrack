import React from 'react';

interface TyroSvgProps {
  isCheering: boolean;
  className?: string;
}

const TyroSvg: React.FC<TyroSvgProps> = ({ isCheering, className }) => {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: 'visible' }}>
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodOpacity="0.3" />
        </filter>
        <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <radialGradient id="eyeGrad" cx="30%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#eab308" />
        </radialGradient>
      </defs>

      <g filter="url(#shadow)">
        {/* Tail (Exhaust Pipe) */}
        <g style={{ transformOrigin: '70px 140px', animation: isCheering ? 'tail-wag 0.2s infinite alternate' : 'tail-idle 2s infinite alternate' }}>
          <path d="M 70 140 Q 30 140 20 100 L 35 95 Q 40 125 70 120 Z" fill="url(#metalGrad)" />
          {/* Smoke puffs when cheering */}
          {isCheering && (
            <g style={{ animation: 'smoke-puff 0.5s infinite linear' }}>
              <circle cx="15" cy="85" r="8" fill="#cbd5e1" opacity="0.8" />
              <circle cx="5" cy="75" r="12" fill="#e2e8f0" opacity="0.6" />
              <circle cx="-5" cy="60" r="16" fill="#f1f5f9" opacity="0.4" />
            </g>
          )}
        </g>

        {/* Back Spines (Gears) */}
        <g fill="#f59e0b" style={{ transformOrigin: '80px 80px', animation: isCheering ? 'gear-spin 1s infinite linear' : '' }}>
          <path d="M 70 75 L 75 60 L 85 60 L 90 75 Z" />
          <path d="M 60 85 L 75 90 L 75 80 Z" />
        </g>
        <g fill="#f59e0b" style={{ transformOrigin: '100px 65px', animation: isCheering ? 'gear-spin 1s infinite linear reverse' : '' }}>
          <path d="M 90 60 L 95 45 L 105 45 L 110 60 Z" />
        </g>
        <g fill="#f59e0b" style={{ transformOrigin: '120px 75px', animation: isCheering ? 'gear-spin 1s infinite linear' : '' }}>
          <path d="M 110 75 L 115 60 L 125 60 L 130 75 Z" />
        </g>

        {/* Body (Car chassis) */}
        <path d="M 70 140 Q 60 70 120 70 Q 150 70 150 110 Q 150 160 110 160 Q 80 160 70 140 Z" fill="url(#bodyGrad)" />
        <path d="M 80 100 Q 100 80 130 90 L 130 110 Q 100 100 80 120 Z" fill="#bae6fd" opacity="0.3" />

        {/* Legs (Tires) */}
        <g style={{ transformOrigin: '90px 160px', animation: isCheering ? 'tire-bounce 0.3s infinite alternate' : '' }}>
          <circle cx="90" cy="160" r="15" fill="#1e293b" />
          <circle cx="90" cy="160" r="8" fill="url(#metalGrad)" />
          <circle cx="90" cy="160" r="4" fill="#0f172a" />
        </g>
        <g style={{ transformOrigin: '130px 160px', animation: isCheering ? 'tire-bounce 0.3s infinite alternate-reverse' : '' }}>
          <circle cx="130" cy="160" r="18" fill="#1e293b" />
          <circle cx="130" cy="160" r="10" fill="url(#metalGrad)" />
          <circle cx="130" cy="160" r="5" fill="#0f172a" />
          <path d="M 115 160 L 145 160 M 130 145 L 130 175 M 120 150 L 140 170 M 120 170 L 140 150" stroke="#0f172a" strokeWidth="2" />
        </g>

        {/* Head / Neck */}
        <g style={{ transformOrigin: '130px 100px', animation: isCheering ? 'head-bang 0.4s infinite alternate' : 'head-idle 3s infinite alternate' }}>
          {/* Neck (Springs) */}
          <path d="M 130 90 L 150 60 M 135 95 L 155 65" stroke="url(#metalGrad)" strokeWidth="8" strokeLinecap="round" />
          
          {/* Head (Engine block / Hood) */}
          <path d="M 140 70 Q 140 30 170 30 Q 190 30 190 50 Q 190 80 160 80 Z" fill="url(#bodyGrad)" />
          
          {/* Jaw (Grill) */}
          <g style={{ transformOrigin: '160px 80px', animation: isCheering ? 'jaw-chomp 0.15s infinite alternate' : '' }}>
            <path d="M 160 75 Q 180 75 185 60 Q 185 85 160 90 Z" fill="#cbd5e1" />
            <path d="M 165 75 L 165 85 M 172 72 L 172 82 M 179 67 L 179 77" stroke="#475569" strokeWidth="2" />
          </g>

          {/* Eye (Headlight) */}
          <circle cx="170" cy="45" r="12" fill="url(#eyeGrad)" />
          <circle cx="170" cy="45" r="12" fill="none" stroke="#475569" strokeWidth="3" />
          {/* Pupil */}
          <circle cx="174" cy="43" r="4" fill="#000" />
          <circle cx="176" cy="41" r="1.5" fill="#fff" />
          
          {/* Eyebrow (Bumper) */}
          <path d="M 155 35 Q 170 25 185 35" stroke="#475569" strokeWidth="4" strokeLinecap="round" fill="none" style={{ animation: isCheering ? 'eyebrow-raise 0.4s infinite alternate' : '' }} />
        </g>

        {/* Arms (Wrenches) */}
        <g style={{ transformOrigin: '130px 120px', animation: isCheering ? 'arm-wave 0.2s infinite alternate' : 'arm-idle 2s infinite alternate' }}>
          <path d="M 125 115 L 155 135 M 150 130 C 160 120, 170 140, 160 145 Z" fill="url(#metalGrad)" stroke="#475569" strokeWidth="2" />
        </g>

      </g>
      <style>
        {`
          @keyframes tail-idle {
            from { transform: rotate(0deg); }
            to { transform: rotate(5deg); }
          }
          @keyframes tail-wag {
            from { transform: rotate(-10deg); }
            to { transform: rotate(15deg); }
          }
          @keyframes gear-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes tire-bounce {
            from { transform: translateY(0) scaleY(1); }
            to { transform: translateY(-5px) scaleY(1.05); }
          }
          @keyframes head-idle {
            from { transform: rotate(0deg); }
            to { transform: rotate(-3deg); }
          }
          @keyframes head-bang {
            from { transform: rotate(-15deg) translateY(-5px); }
            to { transform: rotate(5deg) translateY(5px); }
          }
          @keyframes jaw-chomp {
            from { transform: rotate(0deg); }
            to { transform: rotate(20deg); }
          }
          @keyframes arm-idle {
            from { transform: rotate(0deg); }
            to { transform: rotate(-10deg); }
          }
          @keyframes arm-wave {
            from { transform: rotate(-30deg); }
            to { transform: rotate(50deg); }
          }
          @keyframes eyebrow-raise {
            from { transform: translateY(0); }
            to { transform: translateY(-4px); }
          }
          @keyframes smoke-puff {
            0% { transform: scale(0.5) translate(0, 0); opacity: 0.8; }
            100% { transform: scale(2) translate(-20px, -20px); opacity: 0; }
          }
        `}
      </style>
    </svg>
  );
};

export default TyroSvg;
