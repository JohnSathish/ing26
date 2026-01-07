import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useEffect, useState } from 'react';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './OurMission.css';

function OurMission() {
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

  // Remove heading tags from content to avoid duplication
  const cleanContent = (html: string) => {
    if (!html) return html;
    // Remove h1, h2, h3 tags and their content if they contain "Our Vision" or "Our Mission"
    return html
      .replace(/<h[1-3][^>]*>.*?Our\s+(Vision|Mission).*?<\/h[1-3]>/gi, '')
      .replace(/<h[1-3][^>]*>.*?<\/h[1-3]>/gi, '') // Remove any remaining h1-h3 tags
      .trim();
  };

  return (
    <div className="our-mission-page">
      <Header />
      <div className="our-mission-content-container">
        <h1>Our Mission</h1>
        <div className="content">
          {settings.about_us_mission ? (
            <div dangerouslySetInnerHTML={{ __html: cleanContent(settings.about_us_mission) }} />
          ) : (
            <p>The Province of Mary Help of Christians, Guwahati (ING) is a diverse, lively, and vibrant missionary province committed to serving the people of Northeast India through education, evangelization, and social development.</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default OurMission;

