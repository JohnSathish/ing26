import { useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './FlashNews.css';

interface FlashNewsItem {
  id: number;
  title: string;
  content: string;
  link_url?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

function FlashNews() {
  const [flashNewsItems, setFlashNewsItems] = useState<FlashNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    loadFlashNews();
    
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const loadFlashNews = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: FlashNewsItem[] }>(
        `${API_ENDPOINTS.BANNERS.LIST}?type=flash_news`
      );
      if (response.success && response.data) {
        // Filter only active items and sort by order_index
        const activeItems = response.data
          .filter(item => item.is_active)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        setFlashNewsItems(activeItems);
      }
    } catch (error) {
      console.error('Failed to load flash news:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (flashNewsItems.length === 0) {
    return null;
  }

  // On mobile, duplicate items for seamless vertical scroll. On desktop, duplicate for horizontal scroll
  const displayItems = [...flashNewsItems, ...flashNewsItems];

  return (
    <section className="flash-news-section">
      <div className="container">
        <div className="flash-news-wrapper">
          <div className="flash-news-label">
            <span className="flash-icon">📢</span>
            <span>Flash News</span>
          </div>
          <div className="flash-news-items">
            <div className="flash-news-items-wrapper">
              {displayItems.map((item, index) => (
                <div 
                  key={`${item.id}-${index}`} 
                  className={`flash-news-item ${item.link_url ? 'clickable' : ''}`}
                  onClick={() => {
                    if (item.link_url) {
                      window.open(item.link_url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  {item.title && (
                    <span className="flash-news-title">{item.title}</span>
                  )}
                  {item.content && (
                    <span className="flash-news-content">{item.content}</span>
                  )}
                  {item.link_url && (
                    <span className="flash-news-link-icon">🔗</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FlashNews;

