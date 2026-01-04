import { useEffect, useState, useRef } from 'react';
import './Statistics.css';

interface StatItem {
  number: string;
  label: string;
  icon: string;
  color: string;
}

const stats: StatItem[] = [
  { number: '65+', label: 'Years of Service', icon: 'calendar', color: '#ef4444' },
  { number: '6', label: 'Dioceses', icon: 'building', color: '#8b5cf6' },
  { number: '100+', label: 'Missionaries', icon: 'people', color: '#10b981' },
  { number: '50+', label: 'Institutions', icon: 'school', color: '#f59e0b' },
];

function Statistics() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const renderIcon = (iconName: string, color: string) => {
    const iconSize = 48;
    switch (iconName) {
      case 'calendar':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        );
      case 'building':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M3 21h18"></path>
            <path d="M5 21V7l8-4v18"></path>
            <path d="M19 21V11l-6-4"></path>
            <line x1="9" y1="9" x2="9" y2="9.01"></line>
            <line x1="9" y1="12" x2="9" y2="12.01"></line>
            <line x1="9" y1="15" x2="9" y2="15.01"></line>
            <line x1="9" y1="18" x2="9" y2="18.01"></line>
          </svg>
        );
      case 'people':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      case 'school':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section ref={sectionRef} className="statistics">
      <div className="container">
        <div className="statistics-header">
          <h2 className="statistics-title">Our Impact in Numbers</h2>
          <p className="statistics-subtitle">Celebrating decades of service and growth</p>
        </div>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`stat-card ${isVisible ? 'visible' : ''}`}
              style={{
                animationDelay: `${index * 0.15}s`,
                '--accent-color': stat.color,
              } as React.CSSProperties}
            >
              <div className="stat-icon-wrapper" style={{ '--icon-color': stat.color } as React.CSSProperties}>
                {renderIcon(stat.icon, stat.color)}
              </div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-card-glow"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Statistics;

