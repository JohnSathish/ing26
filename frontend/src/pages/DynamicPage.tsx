import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import HousesAccordion from '../components/HousesAccordion/HousesAccordion';
import { apiGet } from '../services/api';
import { API_ENDPOINTS, ROUTES } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import { getImageUrl, getPdfUrl } from '../utils/imageUtils';
import Pagination from '../components/Pagination/Pagination';
import './DynamicPage.css';

interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  meta_title: string;
  meta_description: string;
  featured_image: string;
  is_enabled: boolean;
  is_featured: boolean;
  parent_menu?: string;
}

interface Circular {
  id: number;
  title: string;
  month: number;
  year: number;
  file_path: string;
  description: string;
}

interface NewsLineIssue {
  id: number;
  title: string;
  month: number;
  year: number;
  cover_image: string;
  pdf_path: string;
  qr_code_url: string;
  description: string;
}

interface RelatedPage {
  id: number;
  title: string;
  slug: string;
  menu_label: string;
  sort_order: number;
}

function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyCirculars, setMonthlyCirculars] = useState<Circular[]>([]);
  const [loadingCirculars, setLoadingCirculars] = useState(false);
  const [monthlyNewsLine, setMonthlyNewsLine] = useState<NewsLineIssue[]>([]);
  const [loadingNewsLine, setLoadingNewsLine] = useState(false);
  const [relatedPages, setRelatedPages] = useState<RelatedPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(-1);
  const [circularsPage, setCircularsPage] = useState<number>(1);
  const [newslinePage, setNewslinePage] = useState<number>(1);
  const itemsPerPage = 12;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (!slug) {
      setError('Invalid page');
      setLoading(false);
      return;
    }

    loadPage();
  }, [slug]);

  const loadPage = async () => {
    try {
      setLoading(true);
      const response = await apiGet<{ success: boolean; data: Page }>(
        `${API_ENDPOINTS.PAGES.GET}?slug=${slug}`
      );
      
      if (response.success && response.data) {
        setPage(response.data);
        
        // Update page title and meta tags
        document.title = response.data.meta_title || response.data.title;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', response.data.meta_description || response.data.excerpt || '');
        }
        
        // Check if this is a Circulars year page
        if (slug && slug.startsWith('circulars-')) {
          const yearMatch = slug.match(/circulars-(\d{4})/);
          if (yearMatch) {
            const year = parseInt(yearMatch[1], 10);
            loadMonthlyCirculars(year);
          }
        }
        
        // Check if this is a NewsLine page (parent_menu = 'newsline' or slug matches month-year pattern)
        const isNewsLinePage = response.data.parent_menu === 'newsline' || 
                               (slug && slug.match(/^(january|february|march|april|may|june|july|august|september|october|november|december)-\d{4}$/i)) ||
                               response.data.title.match(/^(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{4}$/i);
        
        if (isNewsLinePage) {
          // Extract year from title or slug
          const monthYearMatch = response.data.title.match(/(\d{4})/);
          const slugYearMatch = slug && slug.match(/-(\d{4})$/);
          const year = monthYearMatch ? parseInt(monthYearMatch[1], 10) : 
                      (slugYearMatch ? parseInt(slugYearMatch[1], 10) : null);
          if (year) {
            loadMonthlyNewsLine(year);
          }
        }
        
        // Load related pages (sibling pages with same parent_menu)
        if (response.data.parent_menu) {
          loadRelatedPages(response.data.parent_menu, response.data.id);
        }
      } else {
        setError('Page not found');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyCirculars = async (year: number) => {
    try {
      setLoadingCirculars(true);
      const response = await apiGet<{ success: boolean; data: Circular[] }>(
        `${API_ENDPOINTS.CIRCULARS.LIST}?year=${year}&limit=12`
      );
      
      if (response.success && response.data) {
        // Sort by month (1-12)
        const sorted = [...response.data].sort((a, b) => a.month - b.month);
        setMonthlyCirculars(sorted);
      }
    } catch (error) {
      console.error('Failed to load monthly circulars:', error);
    } finally {
      setLoadingCirculars(false);
    }
  };

  const loadMonthlyNewsLine = async (year: number) => {
    try {
      setLoadingNewsLine(true);
      const response = await apiGet<{ success: boolean; data: NewsLineIssue[]; pagination?: any }>(
        `${API_ENDPOINTS.NEWSLINE.LIST}?year=${year}&limit=100`
      );
      
      if (response.success && response.data) {
        // Sort by month (1-12)
        const sorted = [...response.data].sort((a, b) => a.month - b.month);
        setMonthlyNewsLine(sorted);
      }
    } catch (error) {
      console.error('Failed to load monthly NewsLine:', error);
    } finally {
      setLoadingNewsLine(false);
    }
  };

  const loadRelatedPages = async (parentMenu: string, currentPageId: number) => {
    try {
      const response = await apiGet<{ success: boolean; menu_items: RelatedPage[]; data: Page[] }>(
        `${API_ENDPOINTS.PAGES.LIST}?enabled_only=true`
      );
      
      if (response.success && response.menu_items) {
        // Get all pages with same parent_menu (including current page)
        const allPages = response.menu_items
          .filter(p => p.parent_menu === parentMenu)
          .sort((a, b) => a.sort_order - b.sort_order);
        
        // Find current page index
        const index = allPages.findIndex(p => p.id === currentPageId);
        setCurrentPageIndex(index);
        
        // Set related pages (all siblings, we'll use index to determine prev/next)
        setRelatedPages(allPages);
      }
    } catch (error) {
      console.error('Failed to load related pages:', error);
    }
  };

  if (loading) {
    return (
      <div className="dynamic-page">
        <Header />
        <div className="container">
          <LoadingSpinner message="Loading page..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="dynamic-page">
        <Header />
        <div className="container">
          <div className="error-message">
            <h2>Page Not Found</h2>
            <p>{error || 'The page you are looking for does not exist.'}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dynamic-page">
      <Header />
      <div className="dynamic-page-container">
        <div className="dynamic-page-content">
          {page.featured_image && (
            <div className="dynamic-page-image">
              <img src={page.featured_image} alt={page.title} />
            </div>
          )}
          
          <div className="dynamic-page-body">
            <h1 className="dynamic-page-title">{page.title}</h1>
            
            {page.excerpt && (
              <p className="dynamic-page-excerpt">{page.excerpt}</p>
            )}
            
            {/* Display monthly circulars if this is a Circulars year page */}
            {slug && slug.startsWith('circulars-') && (
              <div className="monthly-circulars-section">
                <h2>Monthly Circulars</h2>
                {loadingCirculars ? (
                  <p>Loading circulars...</p>
                ) : monthlyCirculars.length > 0 ? (
                  <div className="monthly-circulars-grid">
                    {monthlyCirculars.map((circular) => (
                      <div key={circular.id} className="monthly-circular-card">
                        <h3>{getMonthName(circular.month)} {circular.year}</h3>
                        {circular.description && <p className="circular-desc">{circular.description}</p>}
                        {circular.file_path && (
                          <a 
                            href={getPdfUrl(circular.file_path)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="pdf-download-btn"
                          >
                            Download PDF
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No circulars available for this year.</p>
                )}
              </div>
            )}

            {/* Display monthly NewsLine if this is a NewsLine page */}
            {page && (page.parent_menu === 'newsline' || (slug && slug.match(/^(january|february|march|april|may|june|july|august|september|october|november|december)-\d{4}$/i)) || page.title.match(/^(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{4}$/i)) && (
              <div className="monthly-newsline-section">
                <h2>Monthly NewsLine Issues</h2>
                {loadingNewsLine ? (
                  <p>Loading NewsLine issues...</p>
                ) : monthlyNewsLine.length > 0 ? (
                  <>
                    <div className="monthly-newsline-grid">
                      {monthlyNewsLine
                        .slice((newslinePage - 1) * itemsPerPage, newslinePage * itemsPerPage)
                        .map((issue) => (
                        <div key={issue.id} className="monthly-newsline-card">
                          {issue.cover_image && (
                            <div className="newsline-cover">
                              <img src={getImageUrl(issue.cover_image)} alt={issue.title} />
                            </div>
                          )}
                          <div className="newsline-content">
                            <h3>{getMonthName(issue.month)} {issue.year}</h3>
                            {issue.description && <p className="newsline-desc">{issue.description}</p>}
                            {issue.pdf_path && (
                              <a 
                                href={getPdfUrl(issue.pdf_path)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="pdf-download-btn"
                              >
                                Download/View PDF
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {monthlyNewsLine.length > itemsPerPage && (
                      <Pagination
                        currentPage={newslinePage}
                        totalPages={Math.ceil(monthlyNewsLine.length / itemsPerPage)}
                        totalItems={monthlyNewsLine.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setNewslinePage}
                        showItemsPerPage={false}
                        showJumpToPage={true}
                        showInfo={true}
                        className="monthly-items-pagination"
                      />
                    )}
                  </>
                ) : (
                  <p>No NewsLine issues available for this year.</p>
                )}
              </div>
            )}

            {page.content && (
              <div 
                className="dynamic-page-content-html"
                dangerouslySetInnerHTML={{ __html: processContent(page.content) }} 
              />
            )}

            {/* Related Pages Navigation */}
            {relatedPages.length > 1 && (
              <div className="related-pages-navigation">
                <h3>Related Pages</h3>
                <div className="related-pages-list">
                  {relatedPages
                    .filter(p => p.id !== page.id)
                    .map((relatedPage) => (
                    <Link
                      key={relatedPage.id}
                      to={`/page/${relatedPage.slug}`}
                      className="related-page-link"
                    >
                      {relatedPage.menu_label || relatedPage.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Previous/Next Navigation */}
            {currentPageIndex >= 0 && relatedPages.length > 1 && (
              <div className="page-navigation">
                {currentPageIndex > 0 && relatedPages[currentPageIndex - 1] && (
                  <Link
                    to={`/page/${relatedPages[currentPageIndex - 1].slug}`}
                    className="nav-link nav-link-prev"
                  >
                    <span className="nav-arrow">←</span>
                    <div className="nav-content">
                      <span className="nav-label">Previous</span>
                      <span className="nav-title">{relatedPages[currentPageIndex - 1].menu_label || relatedPages[currentPageIndex - 1].title}</span>
                    </div>
                  </Link>
                )}
                {currentPageIndex < relatedPages.length - 1 && relatedPages[currentPageIndex + 1] && (
                  <Link
                    to={`/page/${relatedPages[currentPageIndex + 1].slug}`}
                    className="nav-link nav-link-next"
                  >
                    <div className="nav-content">
                      <span className="nav-label">Next</span>
                      <span className="nav-title">{relatedPages[currentPageIndex + 1].menu_label || relatedPages[currentPageIndex + 1].title}</span>
                    </div>
                    <span className="nav-arrow">→</span>
                  </Link>
                )}
              </div>
            )}

            {/* Display houses accordion for diocese pages */}
            {(() => {
              if (!slug) return null;
              
              const houses = getDioceseHouses(slug);
              
              // Always show for bongaigaon-diocese for testing
              if (slug === 'bongaigaon-diocese' && houses && houses.length > 0) {
                return (
                  <HousesAccordion 
                    houses={houses} 
                    dioceseName={page.title}
                  />
                );
              }
              
              // For other dioceses
              if (houses && houses.length > 0) {
                return (
                  <HousesAccordion 
                    houses={houses} 
                    dioceseName={page.title}
                  />
                );
              }
              
              return null;
            })()}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Get month name from month number
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}

// Process content to fix PDF and image URLs
function processContent(content: string): string {
  // Fix PDF links - ensure they use correct server URL
  content = content.replace(
    /href=["']([^"']*\.pdf)["']/gi,
    (match, url) => {
      const pdfUrl = getPdfUrl(url);
      return `href="${pdfUrl}"`;
    }
  );
  
  // Fix image URLs
  content = content.replace(
    /src=["']([^"']*\.(jpg|jpeg|png|gif|webp))["']/gi,
    (match, url) => {
      // If it's already an absolute URL, keep it
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return match;
      }
      // Use getImageUrl for relative paths
      const absoluteUrl = getImageUrl(url);
      return `src="${absoluteUrl}"`;
    }
  );
  
  return content;
}

// Map diocese slugs to their houses
function getDioceseHouses(slug: string | undefined): Array<{name: string; year?: string; status?: string; note?: string; content?: string}> | null {
  if (!slug) return null;
  
  const housesMap: Record<string, Array<{name: string; year?: string; status?: string; note?: string; content?: string}>> = {
    'bongaigaon-diocese': [
      {
        name: 'Barpeta Road',
        year: '1936',
        status: 'C-1975',
        content: `
          <p>The Mission of Barpeta Road is one of the earliest Catholic establishments in the Assam valley. The region is an ethnic mosaic consisting of the Bodos, the Santals, the Adivasis, the Garos, the Rabhas and others. It is one of the important traditional cultural centres of the Assamese people.</p>
          <p>The Catholic Mission was officially established at Barpeta Road in 1936. The Mission had its primary aim to boost the evangelization work among the Boros.</p>
          <p>Prior to the work of Catholic missionaries among the Boros, the Baptists and the Lutherans had established contacts with them. As early as 1909 the American Baptists and few years later the Lutherans had baptized some Boros in Goalpara area and set up few Christian communities among them.</p>
        `,
      },
      {
        name: 'Bengtol',
        year: '1967',
        status: 'C-1992',
        content: `
          <p>Bengtol is one of the important mission centers in the Bongaigaon Diocese, established in 1967 and canonically erected in 1992.</p>
          <p>The mission at Bengtol has been serving the local community through various educational and pastoral activities.</p>
        `,
      },
      {
        name: 'Doomni',
        year: '1972',
        note: 'Presence attached to Barpeta Road',
        content: `
          <p>The Doomni presence was established in 1972 as a presence attached to Barpeta Road Parish. The origins of the Catholic community in Doomni date back to 1926 with the arrival of Adivasi workers.</p>
          <p>Fr Remus Morra made significant contributions, constructing village chapels and the priests' residence. Fr Chandy Edamala served as the first resident priest, and the parish was officially inaugurated dedicated to the Sacred Heart of Jesus.</p>
          <p><strong>Institutions and Growth:</strong></p>
          <ul>
            <li>Parish school established in 1973</li>
            <li>Parish Church built in 1978</li>
            <li>Boys' hostel established in 1986</li>
            <li>School converted to English medium in 1997</li>
            <li>Don Bosco Youth Centre established</li>
          </ul>
          <p><strong>Sisters' Arrival:</strong> The Missionary Sisters of Mary Help of Christians (MSMHC) arrived in 1984, shifting to St Mary's Convent in 1987. They provide services including schooling, running a girls' hostel, medical care, and evangelization.</p>
          <p><strong>Parish Statistics (2019):</strong> The parish has a Catholic population of 12,000 spread across 27 villages, with 1700 Catholic families. The majority ethnic groups are Adivasis and Bodos, with active lay associations.</p>
        `,
      },
      {
        name: 'Dotma',
        year: '1986',
        status: 'C-2006',
        content: `
          <p>Dotma is a mission center established in 1986 and canonically erected in 2006. The mission serves the local community through various pastoral and educational activities.</p>
        `,
      },
      {
        name: 'Bongaigaon',
        note: 'Presence attached to Kokrajhar',
        content: `
          <p>Bongaigaon is a presence attached to Kokrajhar, serving the local Catholic community in the Bongaigaon area.</p>
        `,
      },
      {
        name: 'Kokrajhar',
        content: `
          <p>Kokrajhar is an important mission center in the Bongaigaon Diocese, serving the local community through various pastoral and educational activities.</p>
        `,
      },
    ],
    // Add other dioceses here as needed
  };

  return housesMap[slug] || null;
}

export default DynamicPage;

