import { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import { getImageUrl } from '../utils/imageUtils';
import './ProvincialSecretary.css';

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

function ProvincialSecretary() {
  const [secretary, setSecretary] = useState<Provincial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecretary();
  }, []);

  const loadSecretary = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Provincial[] }>(
        API_ENDPOINTS.PROVINCIALS.LIST
      );
      if (response.success && response.data) {
        const sec = response.data.find(p => p.title === 'secretary' && p.is_current);
        setSecretary(sec || null);
      }
    } catch (error) {
      console.error('Failed to load Provincial Secretary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="provincial-secretary-page">
        <Header />
        <div className="provincial-secretary-content-container">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="provincial-secretary-page">
      <Header />
      <div className="provincial-secretary-content-container">
        <h1>ING Provincial Secretary</h1>
        {secretary ? (
          <div className="secretary-card">
            {secretary.image && (
              <div className="image-container">
                <img src={getImageUrl(secretary.image)} alt={secretary.name} />
              </div>
            )}
            <div className="content">
              <h2>{secretary.name}</h2>
              <p className="period">
                {secretary.period_start} - {secretary.period_end || 'Present'}
              </p>
              {secretary.bio && (
                <div className="bio" dangerouslySetInnerHTML={{ __html: secretary.bio }} />
              )}
            </div>
          </div>
        ) : (
          <p>No Provincial Secretary information available at this time.</p>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default ProvincialSecretary;

