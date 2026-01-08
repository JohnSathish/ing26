import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';
import { 
  FaHome, 
  FaNewspaper, 
  FaFileAlt, 
  FaImages, 
  FaPhotoVideo,
  FaVideo,
  FaBirthdayCake,
  FaEnvelope,
  FaUserTie,
  FaUsers,
  FaCog,
  FaSlidersH,
  FaImage,
  FaBullhorn,
  FaBuilding,
  FaStar,
  FaLink,
  FaHandshake,
  FaCogs,
  FaUserShield,
  FaFile,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const menuGroups = [
    {
      title: '',
      items: [
        { path: ROUTES.ADMIN.DASHBOARD, label: 'Dashboard', icon: FaHome },
      ]
    },
    {
      title: 'Content Management',
      items: [
        { path: ROUTES.ADMIN.NEWS, label: 'News', icon: FaNewspaper },
        { path: ROUTES.ADMIN.NEWSLINE, label: 'NewsLine', icon: FaFileAlt },
        { path: ROUTES.ADMIN.CIRCULARS, label: 'Circulars', icon: FaFileAlt },
        { path: ROUTES.ADMIN.GALLERY, label: 'Gallery', icon: FaImages },
        { path: ROUTES.ADMIN.PHOTO_GALLERIES, label: 'Photo Galleries', icon: FaPhotoVideo },
        { path: ROUTES.ADMIN.VIDEO_GALLERIES, label: 'Video Galleries', icon: FaVideo },
      ]
    },
    {
      title: 'People & Events',
      items: [
        { path: ROUTES.ADMIN.BIRTHDAY, label: 'Birthday Wishes', icon: FaBirthdayCake },
        { path: ROUTES.ADMIN.MESSAGES, label: 'Messages', icon: FaEnvelope },
        { path: ROUTES.ADMIN.PROVINCIALS, label: 'Provincials', icon: FaUserTie },
        { path: ROUTES.ADMIN.COUNCIL, label: 'Council', icon: FaUsers },
        { path: ROUTES.ADMIN.COMMISSIONS, label: 'Commissions', icon: FaCog },
      ]
    },
    {
      title: 'Site Elements',
      items: [
        { path: ROUTES.ADMIN.HERO_SLIDER, label: 'Hero Slider', icon: FaSlidersH },
        { path: ROUTES.ADMIN.BANNERS, label: 'Banners', icon: FaImage },
        { path: ROUTES.ADMIN.HOUSES, label: 'Houses', icon: FaBuilding },
        { path: ROUTES.ADMIN.STRENNA, label: 'STRENNA', icon: FaStar },
      ]
    },
    {
      title: 'Settings & Links',
      items: [
        { path: ROUTES.ADMIN.QUICK_LINKS, label: 'Quick Links', icon: FaLink },
        { path: ROUTES.ADMIN.COLLABORATIONS, label: 'Collaborations', icon: FaHandshake },
        { path: ROUTES.ADMIN.SETTINGS, label: 'Settings', icon: FaCogs },
        { path: ROUTES.ADMIN.USER_MANAGEMENT, label: 'User Management', icon: FaUserShield },
      ]
    },
    {
      title: 'Pages',
      items: [
        { path: ROUTES.ADMIN.PAGES, label: 'Dynamic Pages', icon: FaFile },
      ]
    },
  ];

  return (
    <div className="admin-layout">
      {/* Mobile Menu Toggle Button */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-header">
          <h2>Admin Panel</h2>
          {user && <p>Welcome, {user.username}</p>}
        </div>
        <nav className="admin-nav">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="nav-group">
              {group.title && (
                <div className="nav-group-title">{group.title}</div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={location.pathname === item.path ? 'active' : ''}
                  >
                    {Icon && <Icon className="nav-icon" />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="admin-footer">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </aside>
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;


