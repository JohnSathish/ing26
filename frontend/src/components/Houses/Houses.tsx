import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './Houses.css';

interface House {
  id: number;
  name: string;
  description: string;
  location: string;
  image: string;
}

function Houses() {
  const [houses, setHouses] = useState<House[]>([]);

  useEffect(() => {
    apiGet<{ success: boolean; data: House[] }>(API_ENDPOINTS.HOUSES.LIST)
      .then((response) => {
        if (response.success && response.data) {
          setHouses(response.data);
        }
      })
      .catch(() => {
        // Silent fail
      });
  }, []);

  const getImageUrl = (image: string | null | undefined): string => {
    if (!image) return '';
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    if (image.startsWith('/uploads/') || image.startsWith('uploads/')) {
      return image.startsWith('/') ? image : '/' + image;
    }
    // Check if it's a public folder image
    if (image.startsWith('/')) {
      return image;
    }
    return '/uploads/images/' + image;
  };

  // Map house/diocese names to their dynamic page slugs
  const getDioceseSlug = (name: string): string | null => {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('bongaigaon')) {
      return 'bongaigaon-diocese';
    }
    if (nameLower.includes('diphu')) {
      return 'diphu-diocese';
    }
    if (nameLower.includes('guwahati')) {
      return 'guwahati-archdiocese';
    }
    if (nameLower.includes('nongstoin')) {
      return 'nongstoin-diocese';
    }
    if (nameLower.includes('tezpur')) {
      return 'tezpur-diocese';
    }
    if (nameLower.includes('tura')) {
      return 'tura-diocese';
    }
    
    return null;
  };

  return (
    <section className="houses" id="houses">
      <div className="container">
        <h2 className="section-title">OUR HOUSES</h2>
        <p className="section-subtitle">Explore our houses across different dioceses</p>
        <div className="houses-grid">
          {houses.map((house) => (
            <div key={house.id} className="house-card">
              {house.image && (
                <div className="house-image">
                  <img 
                    src={getImageUrl(house.image)} 
                    alt={house.name}
                    onError={(e) => {
                      console.error('Failed to load house image:', house.image);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="house-content">
                <h3 className="house-name">{house.name}</h3>
                {house.description && (
                  <p className="house-description">{house.description}</p>
                )}
                {getDioceseSlug(house.name) ? (
                  <Link 
                    to={`/page/${getDioceseSlug(house.name)}`}
                    className="house-read-more-btn"
                  >
                    Read More
                  </Link>
                ) : (
                  <button className="house-read-more-btn">Read More</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Houses;


