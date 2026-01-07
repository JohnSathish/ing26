import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const menuGroups = [
    {
      title: '',
      items: [
        { path: ROUTES.ADMIN.DASHBOARD, label: 'Dashboard' },
      ]
    },
    {
      title: 'Content Management',
      items: [
        { path: ROUTES.ADMIN.NEWS, label: 'News' },
        { path: ROUTES.ADMIN.NEWSLINE, label: 'NewsLine' },
        { path: ROUTES.ADMIN.CIRCULARS, label: 'Circulars' },
        { path: ROUTES.ADMIN.GALLERY, label: 'Gallery' },
      ]
    },
    {
      title: 'People & Events',
      items: [
        { path: ROUTES.ADMIN.BIRTHDAY, label: 'Birthday Wishes' },
        { path: ROUTES.ADMIN.MESSAGES, label: 'Messages' },
        { path: ROUTES.ADMIN.PROVINCIALS, label: 'Provincials' },
        { path: ROUTES.ADMIN.COUNCIL, label: 'Council' },
        { path: ROUTES.ADMIN.COMMISSIONS, label: 'Commissions' },
      ]
    },
    {
      title: 'Site Elements',
      items: [
        { path: ROUTES.ADMIN.HERO_SLIDER, label: 'Hero Slider' },
        { path: ROUTES.ADMIN.BANNERS, label: 'Banners' },
        { path: ROUTES.ADMIN.HOUSES, label: 'Houses' },
        { path: ROUTES.ADMIN.STRENNA, label: 'STRENNA' },
      ]
    },
    {
      title: 'Settings & Links',
      items: [
        { path: ROUTES.ADMIN.QUICK_LINKS, label: 'Quick Links' },
        { path: ROUTES.ADMIN.COLLABORATIONS, label: 'Collaborations' },
        { path: ROUTES.ADMIN.SETTINGS, label: 'Settings' },
      ]
    },
    {
      title: 'Pages',
      items: [
        { path: ROUTES.ADMIN.PAGES, label: 'Dynamic Pages' },
      ]
    },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
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
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={location.pathname === item.path ? 'active' : ''}
                >
                  {item.label}
                </Link>
              ))}
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


