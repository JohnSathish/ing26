import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../services/api';
import { API_ENDPOINTS, ROUTES } from '../../utils/constants';
import './ProvincialMessage.css';

interface Message {
  title: string;
  content: string;
  author_name: string;
  author_title: string;
  author_image: string;
}

function ProvincialMessage() {
  const [message, setMessage] = useState<Message | null>(null);
  const [truncatedContent, setTruncatedContent] = useState<string>('');

  useEffect(() => {
    apiGet<{ success: boolean; data: Message | null }>(API_ENDPOINTS.MESSAGES.LIST)
      .then((response) => {
        if (response.success && response.data) {
          setMessage(response.data);
          
          // Truncate content at "Kerala"
          if (response.data.content) {
            const keralaIndex = response.data.content.toLowerCase().indexOf('kerala');
            if (keralaIndex !== -1) {
              // Find the end of the sentence containing "Kerala"
              const sentenceEnd = response.data.content.indexOf('.', keralaIndex);
              if (sentenceEnd !== -1) {
                setTruncatedContent(response.data.content.substring(0, sentenceEnd + 1));
              } else {
                // If no period after Kerala, find the next word boundary
                const nextSpace = response.data.content.indexOf(' ', keralaIndex + 6);
                if (nextSpace !== -1) {
                  setTruncatedContent(response.data.content.substring(0, nextSpace) + '...');
                } else {
                  setTruncatedContent(response.data.content.substring(0, keralaIndex + 6) + '...');
                }
              }
            } else {
              // If "Kerala" not found, show first 300 characters
              setTruncatedContent(response.data.content.substring(0, 300) + '...');
            }
          }
        }
      })
      .catch(() => {
        // Silent fail
      });
  }, []);

  if (!message) {
    return null;
  }

  const needsReadMore = message.content && truncatedContent && message.content.length > truncatedContent.length;

  return (
    <section className="provincial-message">
      <div className="container">
        <h2 className="section-title-white">PROVINCIAL MESSAGE</h2>
        <div className="message-card">
          {message.author_image && (
            <div className="message-author-image">
              <img src={message.author_image} alt={message.author_name} />
            </div>
          )}
          <div className="message-content">
            <p className="message-quote">"{truncatedContent || message.content}"</p>
            {needsReadMore && (
              <Link to={ROUTES.PROVINCIAL_MESSAGE} className="read-more-link-inline">
                Read More
              </Link>
            )}
            <div className="message-author">
              <p className="author-name">{message.author_name}</p>
              <p className="author-title">{message.author_title}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProvincialMessage;


