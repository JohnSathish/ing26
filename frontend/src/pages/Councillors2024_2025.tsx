import { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import { getImageUrl } from '../utils/imageUtils';
import './Councillors2024_2025.css';

interface CouncilMember {
  id: number;
  name: string;
  role: string;
  image: string;
  bio: string;
  dimension: string;
  commission: string;
}

function Councillors2024_2025() {
  const [members, setMembers] = useState<CouncilMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCouncillors();
  }, []);

  const loadCouncillors = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: CouncilMember[] }>(
        API_ENDPOINTS.COUNCIL.LIST
      );
      if (response.success && response.data) {
        setMembers(response.data);
      }
    } catch (error) {
      console.error('Failed to load councillors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="councillors-page">
        <Header />
        <div className="councillors-content-container">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="councillors-page">
      <Header />
      <div className="councillors-content-container">
        <h1>Councillors 2024 – 2025</h1>
        <p className="description">Members of the Provincial Council for the term 2024-2025</p>
        {members.length > 0 ? (
          <div className="councillors-grid">
            {members.map((member) => (
              <div key={member.id} className="councillor-card">
                {member.image && (
                  <div className="councillor-image">
                    <img src={getImageUrl(member.image)} alt={member.name} />
                  </div>
                )}
                <div className="councillor-content">
                  <h3>{member.name}</h3>
                  {member.role && <p className="role">{member.role}</p>}
                  {member.dimension && <p className="dimension">Dimension: {member.dimension}</p>}
                  {member.commission && <p className="commission">Commission: {member.commission}</p>}
                  {member.bio && (
                    <div className="bio" dangerouslySetInnerHTML={{ __html: member.bio }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No councillors information available at this time.</p>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Councillors2024_2025;

