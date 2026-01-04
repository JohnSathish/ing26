import { useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './BirthdayWishes.css';

interface BirthdayWish {
  id: number;
  name: string;
  date_of_birth: string;
  message: string;
  profile_image: string;
  background_color: string;
}

function BirthdayWishes() {
  const [wishes, setWishes] = useState<BirthdayWish[]>([]);

  useEffect(() => {
    // Fetch 4 birthday wishes for the home page row
    apiGet<{ success: boolean; data: BirthdayWish[] }>(`${API_ENDPOINTS.BIRTHDAY.LIST}?limit=4`)
      .then((response) => {
        if (response.success && response.data) {
          setWishes(response.data);
        }
      })
      .catch(() => {
        // Silent fail
      });
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <section className="birthday-wishes">
      <div className="container">
        <h2 className="section-title">BIRTHDAY WISHES</h2>
        <div className="wishes-grid">
          {wishes.map((wish) => (
            <div
              key={wish.id}
              className="wish-card"
            >
              {wish.profile_image ? (
                <div className="wish-profile">
                  <img 
                    src={wish.profile_image} 
                    alt={wish.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="wish-profile">
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    color: '#9ca3af'
                  }}>
                    🎂
                  </div>
                </div>
              )}
              <h3 className="wish-name">{wish.name}</h3>
              <p className="wish-date">{formatDate(wish.date_of_birth)}</p>
              {wish.message && (
                <p className="wish-message">{wish.message}</p>
              )}
              <button className="wish-btn">Send Wishes</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BirthdayWishes;


