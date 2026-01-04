import { useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './Strenna.css';

interface Strenna {
  id: number;
  year: string;
  title: string;
  content: string;
  image: string | null;
  is_active: boolean;
}

function Strenna() {
  const [strenna, setStrenna] = useState<Strenna | null>(null);

  useEffect(() => {
    apiGet<{ success: boolean; data: Strenna | null }>(API_ENDPOINTS.STRENNA.LIST)
      .then((response) => {
        if (response.success && response.data) {
          setStrenna(response.data);
        }
      })
      .catch((error) => {
        // Silent fail - don't show error on homepage
        console.error('Failed to load STRENNA:', error);
      });
  }, []);

  if (!strenna) {
    return null;
  }

  const getImageUrl = (image: string | null): string => {
    if (!image) return '';
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    if (image.startsWith('/uploads/') || image.startsWith('uploads/')) {
      return image.startsWith('/') ? image : '/' + image;
    }
    return '/uploads/images/' + image;
  };

  const truncateContent = (content: string, maxLength: number = 300): string => {
    if (content.length <= maxLength) return content;
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  };

  const handleImageClick = () => {
    window.open('https://www.youtube.com/watch?v=Zr1YJCum-ZA&feature=youtu.be', '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="strenna">
      <div className="container">
        <h2 className="section-title">STRENNA {strenna.year}</h2>
        <div className="strenna-content">
          {strenna.image && (
            <div className="strenna-image" onClick={handleImageClick}>
              <img src={getImageUrl(strenna.image)} alt={strenna.title} />
              <div className="strenna-image-overlay">
                <div className="play-icon">▶</div>
              </div>
            </div>
          )}
          <div className="strenna-text">
            <p>{truncateContent(strenna.content)}</p>
            <a 
              href="/STRENNA-2025-ENG.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="read-more-link"
            >
              Read More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Strenna;


