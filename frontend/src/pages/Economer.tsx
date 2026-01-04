import { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import { getImageUrl } from '../utils/imageUtils';
import './Economer.css';

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

function Economer() {
  const [economer, setEconomer] = useState<Provincial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEconomer();
  }, []);

  const loadEconomer = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Provincial[] }>(
        API_ENDPOINTS.PROVINCIALS.LIST
      );
      if (response.success && response.data) {
        const econ = response.data.find(p => p.title === 'economer' && p.is_current);
        setEconomer(econ || null);
      }
    } catch (error) {
      console.error('Failed to load Economer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="economer-page">
        <Header />
        <div className="economer-content-container">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="economer-page">
      <Header />
      <div className="economer-content-container">
        <h1>Economer</h1>
        {economer ? (
          <div className="economer-card">
            {economer.image && (
              <div className="image-container">
                <img src={getImageUrl(economer.image)} alt={economer.name} />
              </div>
            )}
            <div className="content">
              <h2>{economer.name}</h2>
              <p className="period">
                {economer.period_start} - {economer.period_end || 'Present'}
              </p>
              {economer.bio && (
                <div className="bio" dangerouslySetInnerHTML={{ __html: economer.bio }} />
              )}
            </div>
          </div>
        ) : (
          <p>No Economer information available at this time.</p>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Economer;

