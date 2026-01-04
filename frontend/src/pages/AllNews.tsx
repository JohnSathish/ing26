import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS, ROUTES } from '../utils/constants';
import './AllNews.css';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  event_date?: string;
}

function AllNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadNews();
  }, [page]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const response = await apiGet<{
        success: boolean;
        data: NewsItem[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(`${API_ENDPOINTS.NEWS.LIST}?page=${page}&limit=12`);

      if (response.success && response.data) {
        setNews(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.pages);
          setTotal(response.pagination.total);
        }
      }
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="all-news-page">
      <Header />
      <div className="all-news-container">
        <div className="container">
          <div className="all-news-header">
            <h1>All News</h1>
            <p className="all-news-subtitle">
              Stay updated with all our latest news and events
            </p>
            {total > 0 && (
              <p className="all-news-count">
                Showing {news.length} of {total} news items
              </p>
            )}
          </div>

          {loading ? (
            <div className="loading-state">
              <p>Loading news...</p>
            </div>
          ) : news.length === 0 ? (
            <div className="empty-state">
              <p>No news items available at the moment.</p>
              <Link to={ROUTES.HOME} className="back-home-link">
                ← Back to Home
              </Link>
            </div>
          ) : (
            <>
              <div className="all-news-grid">
                {news.map((item) => (
                  <div key={item.id} className="all-news-card">
                    <div className="all-news-image-wrapper">
                      {item.featured_image ? (
                        <div className="all-news-image">
                          <img
                            src={item.featured_image}
                            alt={item.title}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              if (target.parentElement) {
                                target.parentElement.classList.add('no-image');
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="all-news-image no-image">
                          <div className="image-placeholder">
                            <span>No Image</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="all-news-content">
                      <p className="all-news-date">{formatDate(item.event_date || item.published_at)}</p>
                      <h3 className="all-news-title">{item.title}</h3>
                      {item.excerpt && (
                        <p className="all-news-excerpt">{item.excerpt}</p>
                      )}
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

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="pagination-btn"
                  >
                    ← Previous
                  </button>
                  <span className="pagination-info">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="pagination-btn"
                  >
                    Next →
                  </button>
                </div>
              )}

              <div className="back-to-home">
                <Link to={ROUTES.HOME} className="back-home-link">
                  ← Back to Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default AllNews;

