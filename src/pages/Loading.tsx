import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

function Loading() {
  const { quotes } = useAppContext();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(5);
  const [currentQuote, setCurrentQuote] = useState(() => {
    if (!quotes || quotes.length === 0) {
      return { text: 'Loading amazing things...', author: 'Habitrack' };
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  });

  useEffect(() => {
    if (quotes && quotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentQuote(quotes[randomIndex]);
    }
  }, [quotes]);

  useEffect(() => {
    if (timeLeft <= 0) {
      navigate('/today', { replace: true });
      return;
    }

    const timerId = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timeLeft, navigate]);

  return (
    <div className="container animate-slide-up" style={{ 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      textAlign: 'center'
    }}>
      <div className="glass-panel animate-pop" style={{ maxWidth: '600px', width: '100%', padding: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontStyle: 'italic', color: 'var(--primary)' }}>
          "{currentQuote.text}"
        </h1>
        {currentQuote.author && (
          <h3 style={{ marginBottom: '3rem', color: 'var(--text-muted)' }}>
            - {currentQuote.author}
          </h3>
        )}
        
        <div style={{ marginTop: '2rem' }}>
          <div style={{ 
            height: '8px', 
            background: 'var(--surface)', 
            borderRadius: '4px', 
            overflow: 'hidden',
            width: '100%',
            marginBottom: '1rem'
          }}>
            <div style={{ 
              height: '100%', 
              width: `${(1 - timeLeft / 5) * 100}%`, 
              background: 'var(--primary)',
              transition: 'width 1s linear'
            }} />
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Getting things ready... {timeLeft}s</p>
        </div>
      </div>
    </div>
  );
}

export default Loading;
