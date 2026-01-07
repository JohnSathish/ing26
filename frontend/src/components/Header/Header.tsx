import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiGet } from '../../services/api';
import { API_ENDPOINTS, ROUTES } from '../../utils/constants';
import { FaChevronDown } from 'react-icons/fa';
import './Header.css';

interface Settings {
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  contact_email?: string;
  contact_phone?: string;
}

interface DynamicPage {
  id: number;
  title: string;
  slug: string;
  menu_label: string;
  parent_menu: string | null;
  is_submenu: boolean;
  sort_order: number;
}

function Header() {
  const [flashNews, setFlashNews] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>({});
  const [currentDate, setCurrentDate] = useState<string>('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [dynamicPages, setDynamicPages] = useState<DynamicPage[]>([]);
  const location = useLocation();
  
  // Safeguard: ensure location is an object with pathname
  const currentPath = location?.pathname || '';
  const currentHash = location?.hash || '';

  // Format current date with day name
  const formatCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return now.toLocaleDateString('en-US', options);
  };

  useEffect(() => {
    // Set current date
    setCurrentDate(formatCurrentDate());

    // Fetch flash news banner
    apiGet<{ success: boolean; data: any[] }>(`${API_ENDPOINTS.BANNERS.LIST}?type=flash_news`)
      .then((response) => {
        if (response.success && response.data && response.data.length > 0) {
          setFlashNews(response.data[0].content || '');
        }
      })
      .catch(() => {
        // Silent fail for public content
      });

    // Fetch settings for social links and contact info
    apiGet<{ success: boolean; data: Settings }>(API_ENDPOINTS.SETTINGS.GET)
      .then((response) => {
        if (response.success && response.data) {
          setSettings(response.data);
        }
      })
      .catch(() => {
        // Silent fail
      });

    // Fetch dynamic pages for menu
    apiGet<{ success: boolean; menu_items: DynamicPage[] }>(`${API_ENDPOINTS.PAGES.LIST}?enabled_only=true`)
      .then((response) => {
        if (response.success && response.menu_items) {
          setDynamicPages(response.menu_items);
        }
      })
      .catch(() => {
        // Silent fail
      });

    // Handle scroll for sticky header
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsSticky(scrollTop > 0);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`header ${isSticky ? 'header-sticky' : ''}`}>
      {/* Top contact bar */}
      <div className="header-top">
        <div className="container">
          <div className="header-top-left">
            <span className="current-date">{currentDate || formatCurrentDate()}</span>
          </div>
          <div className="header-top-right">
            <div className="header-top-social-icons">
              {settings.facebook_url && (
                <a 
                  href={settings.facebook_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-icon facebook"
                  aria-label="Facebook"
                  title="Facebook"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {settings.instagram_url && (
                <a 
                  href={settings.instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-icon instagram"
                  aria-label="Instagram"
                  title="Instagram"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {settings.twitter_url && (
                <a 
                  href={settings.twitter_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-icon twitter"
                  aria-label="Twitter/X"
                  title="Twitter/X"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {settings.youtube_url && (
                <a 
                  href={settings.youtube_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-icon youtube"
                  aria-label="YouTube"
                  title="YouTube"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
              {settings.linkedin_url && (
                <a 
                  href={settings.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-icon linkedin"
                  aria-label="LinkedIn"
                  title="LinkedIn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="header-main">
        <div className="container">
          <div className="header-top-section">
            <div className="header-logo-title-wrapper">
              <Link to={ROUTES.HOME} className="header-logo-link">
                <img src="/logoing.jpg" alt="Province Logo" className="header-logo-img" />
              </Link>
              <Link to={ROUTES.HOME} className="header-title-link">
                <h1 className="header-title">Province of Mary Help of Christians ING: Guwahati</h1>
              </Link>
            </div>
            <div className="header-info">
              <p className="header-address">A. R. Baruah Road, Post Box – 145, Panbazar, Guwahati, India – 781 001</p>
              <p className="header-contact">Contact No.: (0361) 2603531, +91 6901133668</p>
            </div>
          </div>
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
          <nav className={`header-nav ${mobileMenuOpen ? 'open' : ''}`}>
            <Link to={ROUTES.HOME} className={currentPath === ROUTES.HOME ? 'active' : ''}>Home</Link>
            
            <div 
              className={`nav-dropdown ${openDropdown === 'about' ? 'open' : ''}`}
              onMouseEnter={() => !window.matchMedia('(max-width: 768px)').matches && setOpenDropdown('about')}
              onMouseLeave={() => !window.matchMedia('(max-width: 768px)').matches && setOpenDropdown(null)}
            >
              <div 
                className="dropdown-trigger"
                onClick={() => {
                  if (window.matchMedia('(max-width: 768px)').matches) {
                    setOpenDropdown(openDropdown === 'about' ? null : 'about');
                  }
                }}
              >
                <Link 
                  to={ROUTES.ABOUT_US} 
                  className={currentPath.startsWith('/about-us') ? 'active' : ''}
                  onClick={(e) => {
                    if (window.matchMedia('(max-width: 768px)').matches && openDropdown !== 'about') {
                      e.preventDefault();
                    }
                  }}
                >
                  About Us <FaChevronDown className="dropdown-icon" />
                </Link>
              </div>
              <div className="dropdown-menu">
                <Link to={ROUTES.OUR_VISION} className={currentPath === ROUTES.OUR_VISION ? 'active' : ''}>Our Vision</Link>
                <Link to={ROUTES.OUR_MISSION} className={currentPath === ROUTES.OUR_MISSION ? 'active' : ''}>Our Mission</Link>
                {dynamicPages
                  .filter(page => page.parent_menu === 'about')
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(page => (
                    <Link 
                      key={page.id} 
                      to={`/page/${page.slug}`} 
                      className={currentPath === `/page/${page.slug}` ? 'active' : ''}
                    >
                      {page.menu_label || page.title}
                    </Link>
                  ))}
              </div>
            </div>

            <div 
              className={`nav-dropdown ${openDropdown === 'provincials' ? 'open' : ''}`}
              onMouseEnter={() => !window.matchMedia('(max-width: 768px)').matches && setOpenDropdown('provincials')}
              onMouseLeave={() => !window.matchMedia('(max-width: 768px)').matches && setOpenDropdown(null)}
            >
              <div 
                className="dropdown-trigger"
                onClick={() => {
                  if (window.matchMedia('(max-width: 768px)').matches) {
                    setOpenDropdown(openDropdown === 'provincials' ? null : 'provincials');
                  }
                }}
              >
                <Link 
                  to={ROUTES.PROVINCIALS} 
                  className={currentPath.startsWith('/provincials') ? 'active' : ''}
                  onClick={(e) => {
                    if (window.matchMedia('(max-width: 768px)').matches && openDropdown !== 'provincials') {
                      e.preventDefault();
                    }
                  }}
                >
                  ING Provincials <FaChevronDown className="dropdown-icon" />
                </Link>
              </div>
              <div className="dropdown-menu">
                <Link to={ROUTES.VICE_PROVINCIAL} className={currentPath === ROUTES.VICE_PROVINCIAL ? 'active' : ''}>Vice Provincial</Link>
                <Link to={ROUTES.ECONOMER} className={currentPath === ROUTES.ECONOMER ? 'active' : ''}>Economer</Link>
                <Link to={ROUTES.PROVINCIAL_SECRETARY} className={currentPath === ROUTES.PROVINCIAL_SECRETARY ? 'active' : ''}>ING Provincial Secretary</Link>
                {dynamicPages
                  .filter(page => page.parent_menu === 'provincials')
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(page => (
                    <Link 
                      key={page.id} 
                      to={`/page/${page.slug}`} 
                      className={currentPath === `/page/${page.slug}` ? 'active' : ''}
                    >
                      {page.menu_label || page.title}
                    </Link>
                  ))}
              </div>
            </div>

            <Link to={ROUTES.DON_BOSCO} className={currentPath === ROUTES.DON_BOSCO ? 'active' : ''}>Don Bosco</Link>
            <Link to={ROUTES.GC29} className={currentPath === ROUTES.GC29 ? 'active' : ''}>GC29</Link>
            
            <div 
              className={`nav-dropdown ${openDropdown === 'houses' ? 'open' : ''}`}
              onMouseEnter={() => !window.matchMedia('(max-width: 768px)').matches && setOpenDropdown('houses')}
              onMouseLeave={() => !window.matchMedia('(max-width: 768px)').matches && setOpenDropdown(null)}
            >
              <div 
                className="dropdown-trigger"
                onClick={() => {
                  if (window.matchMedia('(max-width: 768px)').matches) {
                    setOpenDropdown(openDropdown === 'houses' ? null : 'houses');
                  }
                }}
              >
                <Link 
                  to={ROUTES.HOME + '#houses'} 
                  className={currentHash === '#houses' || currentPath.includes('/houses/') ? 'active' : ''}
                  onClick={(e) => {
                    if (window.matchMedia('(max-width: 768px)').matches && openDropdown !== 'houses') {
                      e.preventDefault();
                    }
                  }}
                >
                  Houses <FaChevronDown className="dropdown-icon" />
                </Link>
              </div>
              <div className="dropdown-menu">
                {dynamicPages
                  .filter(page => page.parent_menu === 'houses')
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(page => (
                    <Link 
                      key={page.id} 
                      to={`/page/${page.slug}`} 
                      className={currentPath === `/page/${page.slug}` ? 'active' : ''}
                    >
                      {page.menu_label || page.title}
                    </Link>
                  ))}
              </div>
            </div>

            <div 
              className={`nav-dropdown ${openDropdown === 'council' ? 'open' : ''}`}
              onMouseEnter={() => !window.matchMedia('(max-width: 768px)').matches && setOpenDropdown('council')}
              onMouseLeave={() => !window.matchMedia('(max-width: 768px)').matches && setOpenDropdown(null)}
            >
              <div 
                className="dropdown-trigger"
                onClick={() => {
                  if (window.matchMedia('(max-width: 768px)').matches) {
                    setOpenDropdown(openDropdown === 'council' ? null : 'council');
                  }
                }}
              >
                <Link 
                  to={ROUTES.COUNCIL} 
                  className={currentPath.startsWith('/council') ? 'active' : ''}
                  onClick={(e) => {
                    if (window.matchMedia('(max-width: 768px)').matches && openDropdown !== 'council') {
                      e.preventDefault();
                    }
                  }}
                >
                  Council <FaChevronDown className="dropdown-icon" />
                </Link>
              </div>
              <div className="dropdown-menu">
                <Link to={ROUTES.COUNCILLORS_2024_2025} className={currentPath === ROUTES.COUNCILLORS_2024_2025 ? 'active' : ''}>Councillors 2024 – 2025</Link>
                <Link to={ROUTES.DIMENSION} className={currentPath === ROUTES.DIMENSION ? 'active' : ''}>Dimension</Link>
                {dynamicPages
                  .filter(page => page.parent_menu === 'council' && !page.is_submenu)
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(page => (
                    <Link 
                      key={page.id} 
                      to={`/page/${page.slug}`} 
                      className={currentPath === `/page/${page.slug}` ? 'active' : ''}
                    >
                      {page.menu_label || page.title}
                    </Link>
                  ))}
                <div 
                  className={`dropdown-submenu ${openSubmenu === 'commissions' ? 'open' : ''}`}
                  onMouseEnter={() => !window.matchMedia('(max-width: 768px)').matches && setOpenSubmenu('commissions')}
                  onMouseLeave={() => !window.matchMedia('(max-width: 768px)').matches && setOpenSubmenu(null)}
                >
                  <div 
                    className="submenu-trigger"
                    onClick={() => {
                      if (window.matchMedia('(max-width: 768px)').matches) {
                        setOpenSubmenu(openSubmenu === 'commissions' ? null : 'commissions');
                      }
                    }}
                  >
                    <span className="submenu-label">Commissions <FaChevronDown className="submenu-icon" /></span>
                  </div>
                  <div className="submenu-items">
                    <Link to={ROUTES.COMMISSION_SCHOOL_EDUCATION} className={currentPath === ROUTES.COMMISSION_SCHOOL_EDUCATION ? 'active' : ''}>School Education (DBSEM)</Link>
                    <Link to={ROUTES.COMMISSION_HIGHER_EDUCATION} className={currentPath === ROUTES.COMMISSION_HIGHER_EDUCATION ? 'active' : ''}>Higher Education</Link>
                    <Link to={ROUTES.COMMISSION_NON_FORMAL} className={currentPath === ROUTES.COMMISSION_NON_FORMAL ? 'active' : ''}>Non-Formal</Link>
                    <Link to={ROUTES.COMMISSION_YOUTH_AT_RISK} className={currentPath === ROUTES.COMMISSION_YOUTH_AT_RISK ? 'active' : ''}>Youth at Risk (YaR)</Link>
                    <Link to={ROUTES.COMMISSION_MIGRANTS_DESK} className={currentPath === ROUTES.COMMISSION_MIGRANTS_DESK ? 'active' : ''}>Migrant's Desk</Link>
                    <Link to={ROUTES.COMMISSION_YOUTH_CENTRE} className={currentPath === ROUTES.COMMISSION_YOUTH_CENTRE ? 'active' : ''}>Youth Centre / Oratories</Link>
                    <Link to={ROUTES.COMMISSION_SCOUTS_GUIDE} className={currentPath === ROUTES.COMMISSION_SCOUTS_GUIDE ? 'active' : ''}>Scouts & Guide / NCC/ NSS</Link>
                    <Link to={ROUTES.COMMISSION_HOSTEL_BOARDING} className={currentPath === ROUTES.COMMISSION_HOSTEL_BOARDING ? 'active' : ''}>Hostel & Boarding</Link>
                    <Link to={ROUTES.COMMISSION_SPORTS_ACADEMY} className={currentPath === ROUTES.COMMISSION_SPORTS_ACADEMY ? 'active' : ''}>Sports Academy</Link>
                    <Link to={ROUTES.COMMISSION_FORMATION} className={currentPath === ROUTES.COMMISSION_FORMATION ? 'active' : ''}>Formation</Link>
                    <Link to={ROUTES.COMMISSION_SALESIAN_FAMILY} className={currentPath === ROUTES.COMMISSION_SALESIAN_FAMILY ? 'active' : ''}>Salesian Family</Link>
                    <Link to={ROUTES.COMMISSION_COOPERATORS_ADMA} className={currentPath === ROUTES.COMMISSION_COOPERATORS_ADMA ? 'active' : ''}>Cooperators & ADMA</Link>
                    <Link to={ROUTES.COMMISSION_PAST_PUPIL} className={currentPath === ROUTES.COMMISSION_PAST_PUPIL ? 'active' : ''}>Past Pupil</Link>
                    <Link to={ROUTES.COMMISSION_SOCIAL_COMMUNICATION} className={currentPath === ROUTES.COMMISSION_SOCIAL_COMMUNICATION ? 'active' : ''}>Social Communication</Link>
                    <Link to={ROUTES.COMMISSION_PROTECTOR_MINOR} className={currentPath === ROUTES.COMMISSION_PROTECTOR_MINOR ? 'active' : ''}>Protector of Minor</Link>
                    <Link to={ROUTES.COMMISSION_ECOLOGY} className={currentPath === ROUTES.COMMISSION_ECOLOGY ? 'active' : ''}>Ecology</Link>
                  </div>
                </div>
              </div>
            </div>

            <div 
              className={`nav-dropdown ${openDropdown === 'newsline' ? 'open' : ''}`}
              onMouseEnter={() => !window.matchMedia('(max-width: 768px)').matches && setOpenDropdown('newsline')}
              onMouseLeave={() => !window.matchMedia('(max-width: 768px)').matches && setOpenDropdown(null)}
            >
              <div 
                className="dropdown-trigger"
                onClick={() => {
                  if (window.matchMedia('(max-width: 768px)').matches) {
                    setOpenDropdown(openDropdown === 'newsline' ? null : 'newsline');
                  }
                }}
              >
                <Link 
                  to={ROUTES.NEWSLINE} 
                  className={currentPath === ROUTES.NEWSLINE ? 'active' : ''}
                  onClick={(e) => {
                    if (window.matchMedia('(max-width: 768px)').matches && openDropdown !== 'newsline') {
                      e.preventDefault();
                    }
                  }}
                >
                  NewsLine <FaChevronDown className="dropdown-icon" />
                </Link>
              </div>
              <div className="dropdown-menu">
                {dynamicPages
                  .filter(page => page.parent_menu === 'newsline')
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(page => (
                    <Link 
                      key={page.id} 
                      to={`/page/${page.slug}`} 
                      className={currentPath === `/page/${page.slug}` ? 'active' : ''}
                    >
                      {page.menu_label || page.title}
                    </Link>
                  ))}
              </div>
            </div>

            <div 
              className={`nav-dropdown ${openDropdown === 'circulars' ? 'open' : ''}`}
              onMouseEnter={() => !window.matchMedia('(max-width: 768px)').matches && setOpenDropdown('circulars')}
              onMouseLeave={() => !window.matchMedia('(max-width: 768px)').matches && setOpenDropdown(null)}
            >
              <div 
                className="dropdown-trigger"
                onClick={() => {
                  if (window.matchMedia('(max-width: 768px)').matches) {
                    setOpenDropdown(openDropdown === 'circulars' ? null : 'circulars');
                  }
                }}
              >
                <Link 
                  to={ROUTES.CIRCULARS} 
                  className={currentPath === ROUTES.CIRCULARS ? 'active' : ''}
                  onClick={(e) => {
                    if (window.matchMedia('(max-width: 768px)').matches && openDropdown !== 'circulars') {
                      e.preventDefault();
                    }
                  }}
                >
                  Circulars <FaChevronDown className="dropdown-icon" />
                </Link>
              </div>
              <div className="dropdown-menu">
                {dynamicPages
                  .filter(page => page.parent_menu === 'circulars')
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(page => (
                    <Link 
                      key={page.id} 
                      to={`/page/${page.slug}`} 
                      className={currentPath === `/page/${page.slug}` ? 'active' : ''}
                    >
                      {page.menu_label || page.title}
                    </Link>
                  ))}
              </div>
            </div>

            <div 
              className={`nav-dropdown ${openDropdown === 'gallery' ? 'open' : ''}`}
              onMouseEnter={() => !window.matchMedia('(max-width: 768px)').matches && setOpenDropdown('gallery')}
              onMouseLeave={() => !window.matchMedia('(max-width: 768px)').matches && setOpenDropdown(null)}
            >
              <div 
                className="dropdown-trigger"
                onClick={() => {
                  if (window.matchMedia('(max-width: 768px)').matches) {
                    setOpenDropdown(openDropdown === 'gallery' ? null : 'gallery');
                  }
                }}
              >
                <Link 
                  to={ROUTES.GALLERY} 
                  className={currentPath === ROUTES.GALLERY ? 'active' : ''}
                  onClick={(e) => {
                    if (window.matchMedia('(max-width: 768px)').matches && openDropdown !== 'gallery') {
                      e.preventDefault();
                    }
                  }}
                >
                  Gallery <FaChevronDown className="dropdown-icon" />
                </Link>
              </div>
              <div className="dropdown-menu">
                {dynamicPages
                  .filter(page => page.parent_menu === 'gallery')
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(page => (
                    <Link 
                      key={page.id} 
                      to={`/page/${page.slug}`} 
                      className={currentPath === `/page/${page.slug}` ? 'active' : ''}
                    >
                      {page.menu_label || page.title}
                    </Link>
                  ))}
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Flash news bar */}
      {flashNews && (
        <div className="flash-news">
          <div className="container">
            <span className="flash-label">Flash News</span>
            <span className="flash-content">{flashNews}</span>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;

