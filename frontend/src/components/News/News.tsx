import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../services/api';
import { API_ENDPOINTS, ROUTES } from '../../utils/constants';
import './News.css';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  event_date?: string;
}

function News() {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    apiGet<{ success: boolean; data: NewsItem[] }>(`${API_ENDPOINTS.NEWS.LIST}?limit=5`)
      .then((response) => {
        if (response.success && response.data) {
          setNews(response.data);
        }
      })
      .catch(() => {
        // Silent fail
      });
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Parse date string and handle timezone issues
    // If date is in YYYY-MM-DD format, parse it as local date to avoid timezone conversion
    const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    let date: Date;
    
    if (dateMatch) {
      // Parse as local date (no timezone conversion)
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1; // Month is 0-indexed
      const day = parseInt(dateMatch[3], 10);
      date = new Date(year, month, day);
    } else {
      // Fallback to standard parsing
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  return (
    <section className="news">
      <div className="container">
        <h2 className="section-title">CHECK OUT OUR LATEST UPDATES</h2>
        <p className="section-subtitle">We like to keep you in touch with our recent events</p>
        {news.length === 0 ? (
          <div className="news-empty">
            <p>No news items available at the moment.</p>
          </div>
        ) : (
          <>
            <div className="news-row">
              {news.map((item) => (
                <div key={item.id} className="news-card-small">
                  <div className="news-image-wrapper">
                    {item.featured_image ? (
                      <div className="news-image">
                        <img src={item.featured_image} alt={item.title} onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.parentElement) {
                            target.parentElement.classList.add('no-image');
                          }
                        }} />
                      </div>
                    ) : (
                      <div className="news-image no-image">
                        <div className="image-placeholder">
                          <span>No Image</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="news-content">
                    <p className="news-date">{formatDate(item.event_date || item.published_at)}</p>
                    <h3 className="news-title">{item.title}</h3>
                    {item.excerpt && <p className="news-excerpt">{item.excerpt}</p>}
                    <Link 
                      to={`/news/${item.slug}`} 
                      className="read-more-link"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      Read More +
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="view-all-news">
              <Link to={ROUTES.ALL_NEWS} className="view-all-link">
                View All News →
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default News;
