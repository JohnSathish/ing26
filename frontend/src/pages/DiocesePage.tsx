import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import { getImageUrl } from '../utils/imageUtils';
import './DiocesePage.css';

interface House {
  id: number;
  name: string;
  description: string;
  location: string;
  image: string;
}

interface DioceseInfo {
  [key: string]: {
    title: string;
    description: string;
  };
}

const dioceseInfo: DioceseInfo = {
  'bongaigaon': {
    title: 'Bongaigaon Diocese',
    description: 'Houses in Bongaigaon Diocese'
  },
  'diphu': {
    title: 'Diphu Diocese',
    description: 'Houses in Diphu Diocese'
  },
  'guwahati': {
    title: 'Guwahati Archdiocese',
    description: 'Houses in Guwahati Archdiocese'
  },
  'nongstoin': {
    title: 'Nongstoin Diocese',
    description: 'Houses in Nongstoin Diocese'
  },
  'tezpur': {
    title: 'Tezpur Diocese',
    description: 'Houses in Tezpur Diocese'
  },
  'tura': {
    title: 'Tura Diocese',
    description: 'Houses in Tura Diocese'
  }
};

function DiocesePage() {
  const { diocese } = useParams<{ diocese: string }>();
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (diocese) {
      loadHouses();
    }
  }, [diocese]);

  const loadHouses = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: House[] }>(
        API_ENDPOINTS.HOUSES.LIST
      );
      if (response.success && response.data) {
        // Filter houses by diocese name in location
        const dioceseName = dioceseInfo[diocese || '']?.title || '';
        const filtered = response.data.filter(house => 
          house.location && house.location.toLowerCase().includes(dioceseName.toLowerCase().split(' ')[0])
        );
        setHouses(filtered);
      }
    } catch (error) {
      console.error('Failed to load houses:', error);
    } finally {
      setLoading(false);
    }
  };

  const info = diocese ? dioceseInfo[diocese] : null;

  if (loading) {
    return (
      <div className="diocese-page">
        <Header />
        <div className="diocese-content-container">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="diocese-page">
      <Header />
      <div className="diocese-content-container">
        {info && (
          <>
            <h1>{info.title}</h1>
            <p className="description">{info.description}</p>
          </>
        )}
        {houses.length > 0 ? (
          <div className="houses-grid">
            {houses.map((house) => (
              <div key={house.id} className="house-card">
                {house.image && (
                  <div className="house-image">
                    <img src={getImageUrl(house.image)} alt={house.name} />
                  </div>
                )}
                <div className="house-content">
                  <h3>{house.name}</h3>
                  {house.location && <p className="location">{house.location}</p>}
                  {house.description && (
                    <div className="house-description" dangerouslySetInnerHTML={{ __html: house.description }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No houses found for this diocese.</p>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default DiocesePage;

