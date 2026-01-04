import { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './Provincials.css';

interface Provincial {
  id: number;
  name: string;
  title: 'provincial' | 'vice_provincial' | 'economer' | 'secretary';
  image: string;
  bio: string;
  period_start: string;
  period_end: string;
  is_current: boolean;
}

function Provincials() {
  const [provincials, setProvincials] = useState<Provincial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProvincials();
  }, []);

  const loadProvincials = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Provincial[] }>(
        API_ENDPOINTS.PROVINCIALS.LIST
      );
      if (response.success) {
        setProvincials(response.data);
      }
    } catch (error) {
      console.error('Failed to load provincials:', error);
    } finally {
      setLoading(false);
    }
  };

  const titleLabels: { [key: string]: string } = {
    provincial: 'Provincial',
    vice_provincial: 'Vice Provincial',
    economer: 'Economer',
    secretary: 'Secretary',
  };

  const groupedByTitle = provincials.reduce((acc, p) => {
    if (!acc[p.title]) {
      acc[p.title] = [];
    }
    acc[p.title].push(p);
    return acc;
  }, {} as { [key: string]: Provincial[] });

  return (
    <div className="provincials-page">
      <Header />
      <div className="provincials-content-container">
        <h1>ING Provincials</h1>

        {loading ? (
          <p>Loading...</p>
        ) : (
          Object.entries(groupedByTitle).map(([title, items]) => (
            <section key={title} className="provincial-section">
              <h2>{titleLabels[title]}</h2>
              <div className="provincials-grid">
                {items.map((provincial) => (
                  <div key={provincial.id} className={`provincial-card ${provincial.is_current ? 'current' : ''}`}>
                    {provincial.image && (
                      <div className="provincial-image">
                        <img src={provincial.image} alt={provincial.name} />
                      </div>
                    )}
                    <div className="provincial-info">
                      <h3>{provincial.name}</h3>
                      <p className="provincial-title">{titleLabels[provincial.title]}</p>
                      {provincial.period_start && (
                        <p className="provincial-period">
                          {new Date(provincial.period_start).getFullYear()} - {provincial.period_end ? new Date(provincial.period_end).getFullYear() : 'Present'}
                        </p>
                      )}
                      {provincial.bio && <p className="provincial-bio">{provincial.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Provincials;

