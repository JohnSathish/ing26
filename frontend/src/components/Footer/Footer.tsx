import { useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './Footer.css';

function Footer() {
  const [quickLinks, setQuickLinks] = useState<Array<{ title: string; url: string; icon: string }>>([]);
  const [cookiesAccepted, setCookiesAccepted] = useState<boolean>(false);
  const [visitorCount, setVisitorCount] = useState<number>(0);

  useEffect(() => {
    loadQuickLinks();
    loadVisitorCount();
    // Check if cookies were already accepted
    const accepted = localStorage.getItem('cookiesAccepted');
    if (accepted === 'true') {
      setCookiesAccepted(true);
    }
  }, []);

  const loadQuickLinks = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Array<{ title: string; url: string; icon: string }> }>(
        API_ENDPOINTS.QUICK_LINKS.LIST
      );
      if (response.success && response.data) {
        setQuickLinks(response.data);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const loadVisitorCount = async () => {
    try {
      // Check if this session has already been counted
      const sessionCounted = sessionStorage.getItem('visitorCounted');
      
      if (!sessionCounted) {
        // Mark this session as counted
        sessionStorage.setItem('visitorCounted', 'true');
        
        // Try to fetch from API if available (for server-side tracking)
        try {
          const response = await apiGet<{ success: boolean; data: any }>(
            `${API_ENDPOINTS.SETTINGS.GET}?key=visitor_count`
          );
          if (response.success && response.data?.visitor_count) {
            const count = parseInt(response.data.visitor_count, 10) || 1247;
            setVisitorCount(count + 1);
            return;
          }
        } catch (error) {
          // API not available, use localStorage
        }
        
        // Fallback: Use localStorage for client-side tracking
        const stored = localStorage.getItem('visitorCount');
        const count = stored ? parseInt(stored, 10) : 1247; // Default starting count
        const updated = count + 1;
        localStorage.setItem('visitorCount', updated.toString());
        setVisitorCount(updated);
      } else {
        // Session already counted, just display the stored count
        const stored = localStorage.getItem('visitorCount');
        const count = stored ? parseInt(stored, 10) : 1247;
        setVisitorCount(count);
      }
    } catch (error) {
      // Error handling: just display stored count
      const stored = localStorage.getItem('visitorCount');
      const count = stored ? parseInt(stored, 10) : 1247;
      setVisitorCount(count);
    }
  };

  const formatVisitorCount = (count: number): string => {
    return count.toLocaleString('en-US');
  };

  const handleAcceptCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setCookiesAccepted(true);
  };

  return (
    <footer id="footer" className="footer">
      <div className="footer-top">
        <div className="container">
          <p>Latest updates and news from Province of Mary Help of Christians ING: Guwahati</p>
        </div>
      </div>
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-column">
              <h3>Quick Links</h3>
              <div className="quick-links-list">
                {quickLinks.length > 0 ? (
                  quickLinks.map((link, index) => (
                    <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="quick-link">
                      {link.icon && <img src={link.icon} alt="" style={{ width: '20px', height: '20px', marginRight: '0.5rem' }} />}
                      {link.title}
                    </a>
                  ))
                ) : (
                  <div className="tag-cloud">
                    {['Education', 'Community', 'Youth', 'Ministry', 'Programs', 'Events', 'Don Bosco', 'Guwahati'].map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="footer-column">
              <h3>Visitors Count</h3>
              <div className="visitor-count">
                <div className="visitor-count-number">{formatVisitorCount(visitorCount)}</div>
                <p className="visitor-count-label">Total Visitors</p>
              </div>
            </div>
            <div className="footer-column">
              <h3>Scan & Visit NEWSLINE December 2025</h3>
              <div className="newsline-qr-section">
                <a 
                  href="https://heyzine.com/flip-book/f6310a3443.html#page/2" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="newsline-link"
                >
                  <img src="/ING-Newsline.png" alt="NEWSLINE December 2025 QR Code" className="newsline-qr-image" />
                </a>
                <p className="newsline-description">Scan the QR code to visit NEWSLINE December 2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <p>Copyright © 2014-2025 donboscoingguwahati.org. All rights reserved.</p>
            <nav className="footer-nav">
              <a href="#">Home</a>
              <a href="#">About Us</a>
              <a href="#">Don Bosco</a>
              <a href="#">GC28</a>
              <a href="#">Houses</a>
              <a href="#">Council</a>
              <a href="#">NewsLine</a>
              <a href="#">Circulars</a>
              <a href="#">Gallery</a>
            </nav>
          </div>
        </div>
      </div>
      {!cookiesAccepted && (
        <div className="cookie-notice">
          <div className="container">
            <p>We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.</p>
            <button onClick={handleAcceptCookies}>Accept</button>
          </div>
        </div>
      )}
    </footer>
  );
}

export default Footer;


