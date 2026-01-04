import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS, ROUTES } from '../utils/constants';
import './ProvincialMessagePage.css';

interface Message {
  title: string;
  content: string;
  author_name: string;
  author_title: string;
  author_image: string;
}

function ProvincialMessagePage() {
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    apiGet<{ success: boolean; data: Message | null }>(API_ENDPOINTS.MESSAGES.LIST)
      .then((response) => {
        if (response.success && response.data) {
          setMessage(response.data);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch provincial message:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatContent = (text: string): string => {
    if (!text) return '';
    
    const paragraphs = text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    let html = '';
    paragraphs.forEach(para => {
      html += `<p>${escapeHtml(para)}</p>`;
    });
    
    return html;
  };

  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  if (loading) {
    return (
      <div className="provincial-message-page">
        <Header />
        <div className="provincial-message-content-container">
          <div className="loading">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!message) {
    return (
      <div className="provincial-message-page">
        <Header />
        <div className="provincial-message-content-container">
          <div className="no-message">No provincial message available.</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="provincial-message-page">
      <Header />
      <div className="provincial-message-content-container">
        <nav className="breadcrumb">
          <Link to={ROUTES.HOME}>Home</Link>
          <span> / </span>
          <span>Provincial Message</span>
        </nav>
        
        <h1 className="page-title">PROVINCIAL MESSAGE</h1>
        
        <div className="message-full-card">
          {message.author_image && (
            <div className="message-author-image-full">
              <img src={message.author_image} alt={message.author_name} />
            </div>
          )}
          <div className="message-content-full">
            <div 
              className="message-quote-full"
              dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
            />
            <div className="message-author-full">
              <p className="author-name-full">{message.author_name}</p>
              <p className="author-title-full">{message.author_title}</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ProvincialMessagePage;

