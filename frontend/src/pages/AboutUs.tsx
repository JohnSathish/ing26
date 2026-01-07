import { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './AboutUs.css';

function AboutUs() {
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
    // Remove h1, h2, h3 tags that contain "Our Vision" or "Our Mission"
    return html
      .replace(/<h[1-3][^>]*>.*?Our\s+(Vision|Mission).*?<\/h[1-3]>/gi, '')
      .trim();
  };

  return (
    <div className="about-us-page">
      <Header />
      <div className="about-us-content-container">
        <h1>About Us</h1>
        
        <section id="vision" className="section">
          <h2>Our Vision</h2>
          <div className="content">
            {settings.about_us_vision ? (
              <div dangerouslySetInnerHTML={{ __html: cleanContent(settings.about_us_vision) }} />
            ) : (
              <p>Our vision is to serve the people of Northeast India through education, social development, and spiritual guidance.</p>
            )}
          </div>
        </section>

        <section id="mission" className="section">
          <h2>Our Mission</h2>
          <div className="content">
            {settings.about_us_mission ? (
              <div dangerouslySetInnerHTML={{ __html: cleanContent(settings.about_us_mission) }} />
            ) : (
              <p>The Province of Mary Help of Christians, Guwahati (ING) is a diverse, lively, and vibrant missionary province committed to serving the people of Northeast India.</p>
            )}
          </div>
        </section>

        <section className="section">
          <h2>History</h2>
          <div className="content">
            <p>1922 – The state of Assam (the present NE India with its seven states of Assam, Meghalaya, Arunachal Pradesh, Nagaland, Manipur, Mizoram and Tripura) was entrusted to the Salesians of Don Bosco.</p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}

export default AboutUs;

