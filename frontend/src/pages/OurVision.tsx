import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useEffect, useState } from 'react';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './OurVision.css';

function OurVision() {
  const [settings, setSettings] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    apiGet<{ success: boolean; data: { [key: string]: string } }>(API_ENDPOINTS.SETTINGS.GET)
      .then((response) => {
        if (response.success && response.data) {
          setSettings(response.data);
        }
      })
      .catch(() => {
        // Silent fail
      });
  }, []);

  return (
    <div className="our-vision-page">
      <Header />
      <div className="our-vision-content-container">
        <h1>Our Vision</h1>
        <div className="content">
          {settings.about_us_vision ? (
            <div dangerouslySetInnerHTML={{ __html: settings.about_us_vision }} />
          ) : (
            <p>Our vision is to serve the people of Northeast India through education, social development, and spiritual guidance, following the charism of Don Bosco.</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default OurVision;

