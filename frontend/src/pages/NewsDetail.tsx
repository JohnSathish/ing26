import { useEffect, useState, useRef } from 'react';
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

interface BirthdayWish {
  id: number;
  name: string;
  date_of_birth: string;
  message?: string;
  profile_image: string;
  background_color: string;
}

function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [birthdayWishes, setBirthdayWishes] = useState<BirthdayWish[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

  // Update currentIndex when allNews changes
  useEffect(() => {
    if (allNews.length > 0 && news) {
      const index = allNews.findIndex(item => item.slug === news.slug);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [allNews, news]);

  // Process images into collage layout after content is rendered
  useEffect(() => {
    if (!contentRef.current || !news) return;

    const processImages = () => {
      const contentElement = contentRef.current;
      if (!contentElement) return;

      // Find all images in the content
      const images = Array.from(contentElement.querySelectorAll('img'));
      if (images.length < 2) return; // Only process if there are 2+ images

      // Helper function to check if two elements are close (within reasonable distance)
      const areConsecutive = (img1: HTMLImageElement, img2: HTMLImageElement): boolean => {
        // Check if they're siblings
        if (img1.nextElementSibling === img2 || img2.nextElementSibling === img1) {
          return true;
        }

        // Check if they're in adjacent paragraphs/divs with minimal text
        const img1Parent = img1.parentElement;
        const img2Parent = img2.parentElement;
        
        if (img1Parent && img2Parent) {
          // If same parent, they're consecutive
          if (img1Parent === img2Parent) {
            return true;
          }

          // Check if parents are siblings and contain mostly just the image
          if (img1Parent.nextElementSibling === img2Parent || 
              img2Parent.nextElementSibling === img1Parent) {
            const img1Text = img1Parent.textContent?.trim().replace(img1.alt || '', '').trim() || '';
            const img2Text = img2Parent.textContent?.trim().replace(img2.alt || '', '').trim() || '';
            // If parent elements have minimal text (just whitespace or very short), consider consecutive
            if (img1Text.length < 50 && img2Text.length < 50) {
              return true;
            }
          }
        }

        return false;
      };

      // Group consecutive images
      const imageGroups: HTMLImageElement[][] = [];
      let currentGroup: HTMLImageElement[] = [images[0]];

      for (let i = 1; i < images.length; i++) {
        const currentImg = images[i];
        const lastImg = currentGroup[currentGroup.length - 1];

        if (areConsecutive(lastImg, currentImg)) {
          currentGroup.push(currentImg);
        } else {
          if (currentGroup.length > 1) {
            imageGroups.push([...currentGroup]);
          }
          currentGroup = [currentImg];
        }
      }

      // Add the last group if it has multiple images
      if (currentGroup.length > 1) {
        imageGroups.push(currentGroup);
      }

      // Process each group of consecutive images
      imageGroups.forEach((group) => {
        if (group.length < 2) return; // Skip single images

        // Create collage container
        const collage = document.createElement('div');
        const imageCount = Math.min(group.length, 9); // Cap at 9 for CSS classes
        collage.className = `image-collage image-collage-${imageCount}`;

        // Move images into collage
        group.forEach((img) => {
          // Remove existing margins and styling
          img.style.margin = '0';
          img.style.display = 'block';
          img.style.width = '100%';
          img.style.height = 'auto';
          
          // Wrap image in a container for better control
          const imgWrapper = document.createElement('div');
          imgWrapper.className = 'collage-image-wrapper';
          
          // Clone the image to preserve attributes
          const clonedImg = img.cloneNode(true) as HTMLImageElement;
          clonedImg.style.margin = '0';
          clonedImg.style.display = 'block';
          clonedImg.style.width = '100%';
          clonedImg.style.height = 'auto';
          
          imgWrapper.appendChild(clonedImg);
          collage.appendChild(imgWrapper);
        });

        // Insert collage before the first image's parent element
        const firstImg = group[0];
        const firstParent = firstImg.parentElement;
        
        if (firstParent) {
          // Insert collage before the parent
          firstParent.parentNode?.insertBefore(collage, firstParent);
          
          // Remove all images in the group from their original positions
          group.forEach((img) => {
            const parent = img.parentElement;
            if (parent) {
              // If parent only contains the image (or minimal text), remove the parent too
              const parentText = parent.textContent?.trim().replace(img.alt || '', '').trim() || '';
              if (parentText.length < 50 && parent.children.length === 1) {
                parent.remove();
              } else {
                img.remove();
              }
            }
          });
        }
      });
    };

    // Process images after a short delay to ensure DOM is ready
    const timer = setTimeout(processImages, 100);
    return () => clearTimeout(timer);
  }, [news]);

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

      // Load latest news for sidebar (excluding current news)
      const latestNewsResponse = await apiGet<{ success: boolean; data: NewsItem[] }>(
        `${API_ENDPOINTS.NEWS.LIST}?limit=5&page=1`
      );
      if (latestNewsResponse.success && latestNewsResponse.data) {
        // Filter out current news item
        const filtered = latestNewsResponse.data.filter(item => item.slug !== slug);
        setLatestNews(filtered.slice(0, 5));
      }

      // Load birthday wishes for sidebar
      const birthdayResponse = await apiGet<{ success: boolean; data: BirthdayWish[] }>(
        `${API_ENDPOINTS.BIRTHDAY.LIST}?limit=5&page=1`
      );
      if (birthdayResponse.success && birthdayResponse.data) {
        setBirthdayWishes(birthdayResponse.data);
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

  const formatBirthdayDate = (dateString: string) => {
    if (!dateString) return '';
    const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    let date: Date;
    
    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1;
      const day = parseInt(dateMatch[3], 10);
      date = new Date(year, month, day);
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // For birthday, show month and day only (no year)
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    return `${month} ${day}`;
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

        {/* Layout with Sidebar */}
        <div className="news-detail-layout">
          {/* Main Content */}
          <div className="news-detail-main">
            {/* Featured Image at Top */}
            {news.featured_image && (
              <div className="news-detail-image">
                <div className="article-image-wrapper">
                  <img src={news.featured_image} alt={news.title} />
                </div>
              </div>
            )}

            {/* Content Section */}
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
                <div className="article-content" ref={contentRef}>
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

                {/* Enhanced Pagination */}
                {allNews.length > 1 && (
                  <div className="news-pagination">
                    <div className="pagination-info">
                      <span className="pagination-current">{currentIndex + 1}</span>
                      <span className="pagination-separator">of</span>
                      <span className="pagination-total">{allNews.length}</span>
                    </div>
                    <div className="pagination-controls">
                      <button
                        onClick={goToPrevious}
                        disabled={currentIndex === 0}
                        className="pagination-btn pagination-prev"
                        title="Previous news"
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={goToNext}
                        disabled={currentIndex === allNews.length - 1}
                        className="pagination-btn pagination-next"
                        title="Next news"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}

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
          </div>

          {/* Sidebar */}
          <aside className="news-sidebar">
            {/* Latest News Section */}
            {latestNews.length > 0 && (
              <div className="sidebar-section">
                <h3 className="sidebar-title">
                  <span className="sidebar-icon">📰</span>
                  Latest News
                </h3>
                <div className="sidebar-news-list">
                  {latestNews.map((item) => (
                    <Link
                      key={item.id}
                      to={`/news/${item.slug}`}
                      className="sidebar-news-item"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      {item.featured_image && (
                        <div className="sidebar-news-image">
                          <img src={item.featured_image} alt={item.title} />
                        </div>
                      )}
                      <div className="sidebar-news-content">
                        <h4 className="sidebar-news-title">{item.title}</h4>
                        <p className="sidebar-news-date">
                          {formatDate(item.event_date || item.published_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link to={ROUTES.ALL_NEWS} className="sidebar-view-all">
                  View All News →
                </Link>
              </div>
            )}

            {/* Birthday Wishes Section */}
            {birthdayWishes.length > 0 && (
              <div className="sidebar-section">
                <h3 className="sidebar-title">
                  <span className="sidebar-icon">🎂</span>
                  Birthday Wishes
                </h3>
                <div className="sidebar-birthday-list">
                  {birthdayWishes.map((wish) => (
                    <div key={wish.id} className="sidebar-birthday-item">
                      {wish.profile_image ? (
                        <div className="sidebar-birthday-image">
                          <img src={wish.profile_image} alt={wish.name} />
                        </div>
                      ) : (
                        <div 
                          className="sidebar-birthday-avatar"
                          style={{ backgroundColor: wish.background_color || '#6B46C1' }}
                        >
                          {wish.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="sidebar-birthday-content">
                        <h4 className="sidebar-birthday-name">{wish.name}</h4>
                        <p className="sidebar-birthday-date">
                          {formatBirthdayDate(wish.date_of_birth)}
                        </p>
                        {wish.message && (
                          <p className="sidebar-birthday-message">{wish.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default NewsDetail;

