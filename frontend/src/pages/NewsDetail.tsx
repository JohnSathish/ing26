import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS, ROUTES } from '../utils/constants';
import './NewsDetail.css';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  is_featured: boolean;
  published_at: string;
  event_date?: string;
  created_at: string;
  updated_at: string;
}

function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (!slug) {
      setError('Invalid news item');
      setLoading(false);
      return;
    }

    loadNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadNews = async () => {
    try {
      // Load all news items for navigation
      const allNewsResponse = await apiGet<{ success: boolean; data: NewsItem[] }>(
        API_ENDPOINTS.NEWS.LIST
      );
      if (allNewsResponse.success && allNewsResponse.data) {
        setAllNews(allNewsResponse.data);
        
        // Find current news item index
        const index = allNewsResponse.data.findIndex(item => item.slug === slug);
        if (index !== -1) {
          setCurrentIndex(index);
          setNews(allNewsResponse.data[index]);
        } else {
          // Try to load by slug if not found in list
          const response = await apiGet<{ success: boolean; data: NewsItem }>(
            `${API_ENDPOINTS.NEWS.GET}?slug=${slug}`
          );
          if (response.success && response.data) {
            setNews(response.data);
          } else {
            setError('News item not found');
          }
        }
      } else {
        // Fallback: load single news item
        const response = await apiGet<{ success: boolean; data: NewsItem }>(
          `${API_ENDPOINTS.NEWS.GET}?slug=${slug}`
        );
        if (response.success && response.data) {
          setNews(response.data);
        } else {
          setError('News item not found');
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load news item');
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    if (allNews.length > 0 && currentIndex > 0) {
      const prevNews = allNews[currentIndex - 1];
      navigate(`/news/${prevNews.slug}`);
      setCurrentIndex(currentIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNext = () => {
    if (allNews.length > 0 && currentIndex < allNews.length - 1) {
      const nextNews = allNews[currentIndex + 1];
      navigate(`/news/${nextNews.slug}`);
      setCurrentIndex(currentIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const formatContent = (content: string): string => {
    if (!content) return '';
    
    // If content already has HTML tags, return as is (but ensure proper spacing)
    if (content.includes('<p>') || content.includes('<div>') || content.includes('<br')) {
      // Ensure existing HTML has proper spacing
      return content
        .replace(/<\/p>\s*<p>/g, '</p><p>') // Clean up spacing between existing paragraphs
        .replace(/<p>/g, '<p style="margin-bottom: 1.5rem;">'); // Add spacing to existing paragraphs
    }
    
    // Convert plain text to HTML with proper paragraph breaks
    // First, try splitting by double newlines (paragraph breaks)
    let paragraphs = content
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    // If no double newlines found, try single newlines
    if (paragraphs.length === 1) {
      paragraphs = content
        .split(/\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);
    }
    
    // If still only one paragraph, try splitting by periods followed by space and capital letter
    if (paragraphs.length === 1 && paragraphs[0].length > 200) {
      // Split by sentence endings (period + space + capital letter)
      const sentences = paragraphs[0].split(/(\.\s+[A-Z])/);
      if (sentences.length > 2) {
        // Group sentences into paragraphs (every 3-4 sentences)
        const grouped: string[] = [];
        let current = '';
        for (let i = 0; i < sentences.length; i += 2) {
          current += sentences[i] + (sentences[i + 1] || '');
          if ((i / 2 + 1) % 3 === 0 || i >= sentences.length - 2) {
            grouped.push(current.trim());
            current = '';
          }
        }
        if (grouped.length > 1) {
          paragraphs = grouped;
        }
      }
    }
    
    // Wrap each paragraph in <p> tags with proper spacing
    return paragraphs.map(para => {
      const escaped = escapeHtml(para);
      return `<p style="margin-bottom: 1.5rem;">${escaped}</p>`;
    }).join('');
  };

  const escapeHtml = (text: string): string => {
    // Simple HTML escaping without using DOM
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  if (loading) {
    return (
      <div className="news-detail-page">
        <Header />
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="news-detail-page">
        <Header />
        <div className="container">
          <div className="error-message">
            <h2>News Not Found</h2>
            <p>{error || 'The news item you are looking for does not exist.'}</p>
            <Link to={ROUTES.HOME} className="btn-primary">Go to Home</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="news-detail-page">
      <Header />
      <div className="news-detail-container">
        {/* Navigation Arrows */}
        {allNews.length > 1 && (
          <>
            <button
              className="news-nav news-nav-prev"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              aria-label="Previous news"
            >
              ‹
            </button>
            <button
              className="news-nav news-nav-next"
              onClick={goToNext}
              disabled={currentIndex === allNews.length - 1}
              aria-label="Next news"
            >
              ›
            </button>
          </>
        )}

        {/* Page Indicator */}
        {allNews.length > 1 && (
          <div className="news-counter">
            {currentIndex + 1} / {allNews.length}
          </div>
        )}

        {/* Split Layout */}
        <div className="news-detail-split">
          {/* Left Side - Text Content */}
          <div className="news-detail-content">
            <div className="news-content-wrapper">
              {/* Breadcrumb */}
              <nav className="breadcrumb">
                <Link to={ROUTES.HOME}>Home</Link>
                <span> / </span>
                <Link to={ROUTES.ALL_NEWS}>News</Link>
                <span> / </span>
                <span>{news.title}</span>
              </nav>

              {/* Article Header */}
              <header className="article-header">
                <p className="article-date">{formatDate(news.event_date || news.published_at)}</p>
                <h1 className="article-title">{news.title}</h1>
                {news.excerpt && (
                  <p className="article-excerpt">{news.excerpt}</p>
                )}
              </header>

              {/* Article Content */}
              <div className="article-content">
                {news.content ? (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: formatContent(news.content) 
                    }} 
                  />
                ) : (
                  <p>No content available.</p>
                )}
              </div>

              {/* Article Footer */}
              <footer className="article-footer">
                <div className="article-meta">
                  {news.is_featured && (
                    <span className="featured-badge">Featured</span>
                  )}
                </div>
                <div className="article-actions">
                  <Link to={ROUTES.ALL_NEWS} className="btn-secondary">
                    View All News
                  </Link>
                  <Link to={ROUTES.HOME} className="btn-primary">
                    Go to Home
                  </Link>
                </div>
              </footer>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="news-detail-image">
            {news.featured_image ? (
              <div className="article-image-wrapper">
                <img src={news.featured_image} alt={news.title} />
              </div>
            ) : (
              <div className="article-image-placeholder">
                <p>No Image Available</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default NewsDetail;

