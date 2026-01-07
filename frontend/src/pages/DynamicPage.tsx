import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import HousesAccordion from '../components/HousesAccordion/HousesAccordion';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
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
}

function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } else {
        setError('Page not found');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load page');
    } finally {
      setLoading(false);
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
            
            {page.content && (
              <div 
                className="dynamic-page-content-html"
                dangerouslySetInnerHTML={{ __html: page.content }} 
              />
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

