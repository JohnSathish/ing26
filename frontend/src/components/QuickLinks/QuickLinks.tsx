import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import './QuickLinks.css';

interface QuickLink {
  title: string;
  description: string;
  route: string;
  icon: string;
  color: string;
}

const quickLinks: QuickLink[] = [
  {
    title: 'About Us',
    description: 'Learn about our mission and vision',
    route: ROUTES.ABOUT_US,
    icon: '📖',
    color: '#1e40af',
  },
  {
    title: 'Our Houses',
    description: 'Explore our dioceses and institutions',
    route: ROUTES.HOME + '#houses',
    icon: '🏛️',
    color: '#9333ea',
  },
  {
    title: 'Gallery',
    description: 'View photos and videos',
    route: ROUTES.GALLERY,
    icon: '📸',
    color: '#dc2626',
  },
  {
    title: 'NewsLine',
    description: 'Read our monthly magazine',
    route: ROUTES.NEWSLINE,
    icon: '📰',
    color: '#059669',
  },
  {
    title: 'Circulars',
    description: 'Access official circulars',
    route: ROUTES.CIRCULARS,
    icon: '📋',
    color: '#ea580c',
  },
  {
    title: 'Council',
    description: 'Meet our leadership team',
    route: ROUTES.COUNCIL,
    icon: '👥',
    color: '#0891b2',
  },
];

function QuickLinks() {
  return (
    <section className="quick-links">
      <div className="container">
        <h2 className="section-title">Quick Links</h2>
        <p className="section-subtitle">Navigate to key sections of our website</p>
        <div className="quick-links-grid">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              to={link.route}
              className="quick-link-card"
              style={{ '--accent-color': link.color } as React.CSSProperties}
            >
              <div className="quick-link-icon">{link.icon}</div>
              <h3 className="quick-link-title">{link.title}</h3>
              <p className="quick-link-description">{link.description}</p>
              <span className="quick-link-arrow">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default QuickLinks;

