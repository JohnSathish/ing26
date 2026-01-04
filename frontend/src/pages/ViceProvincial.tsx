import { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import { getImageUrl } from '../utils/imageUtils';
import './ViceProvincial.css';

interface Provincial {
  id: number;
  name: string;
  title: string;
  image: string;
  bio: string;
  period_start: string;
  period_end: string;
  is_current: boolean;
}

function ViceProvincial() {
  const [viceProvincial, setViceProvincial] = useState<Provincial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadViceProvincial();
  }, []);

  const loadViceProvincial = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Provincial[] }>(
        API_ENDPOINTS.PROVINCIALS.LIST
      );
      if (response.success && response.data) {
        const vice = response.data.find(p => p.title === 'vice_provincial' && p.is_current);
        setViceProvincial(vice || null);
      }
    } catch (error) {
      console.error('Failed to load Vice Provincial:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="vice-provincial-page">
        <Header />
        <div className="vice-provincial-content-container">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="vice-provincial-page">
      <Header />
      <div className="vice-provincial-content-container">
        <h1>Vice Provincial</h1>
        {viceProvincial ? (
          <div className="vice-provincial-card">
            {viceProvincial.image && (
              <div className="image-container">
                <img src={getImageUrl(viceProvincial.image)} alt={viceProvincial.name} />
              </div>
            )}
            <div className="content">
              <h2>{viceProvincial.name}</h2>
              <p className="period">
                {viceProvincial.period_start} - {viceProvincial.period_end || 'Present'}
              </p>
              {viceProvincial.bio && (
                <div className="bio" dangerouslySetInnerHTML={{ __html: viceProvincial.bio }} />
              )}
            </div>
          </div>
        ) : (
          <p>No Vice Provincial information available at this time.</p>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default ViceProvincial;

