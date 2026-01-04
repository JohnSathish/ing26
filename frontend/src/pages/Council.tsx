import { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './Council.css';

interface CouncilMember {
  id: number;
  name: string;
  role: string;
  image: string;
  bio: string;
  dimension: string;
  commission: string;
}

interface Dimension {
  dimension: string;
  count: number;
}

interface Commission {
  commission: string;
  count: number;
}

function Council() {
  const [members, setMembers] = useState<CouncilMember[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [selectedCommission, setSelectedCommission] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCouncil();
  }, [selectedDimension, selectedCommission]);

  const loadCouncil = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDimension) params.append('dimension', selectedDimension);
      if (selectedCommission) params.append('commission', selectedCommission);
      
      const response = await apiGet<{ success: boolean; data: CouncilMember[]; dimensions: Dimension[]; commissions: Commission[] }>(
        `${API_ENDPOINTS.COUNCIL.LIST}?${params.toString()}`
      );
      if (response.success) {
        setMembers(response.data);
        if (response.dimensions) setDimensions(response.dimensions);
        if (response.commissions) setCommissions(response.commissions);
      }
    } catch (error) {
      console.error('Failed to load council:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="council-page">
      <Header />
      <div className="council-content-container">
        <h1>Council</h1>

        <div className="council-filters">
          {dimensions.length > 0 && (
            <div className="filter-group">
              <label>Dimension:</label>
              <button
                className={`filter-btn ${selectedDimension === null ? 'active' : ''}`}
                onClick={() => setSelectedDimension(null)}
              >
                All
              </button>
              {dimensions.map((dim) => (
                <button
                  key={dim.dimension}
                  className={`filter-btn ${selectedDimension === dim.dimension ? 'active' : ''}`}
                  onClick={() => setSelectedDimension(selectedDimension === dim.dimension ? null : dim.dimension)}
                >
                  {dim.dimension} ({dim.count})
                </button>
              ))}
            </div>
          )}

          {commissions.length > 0 && (
            <div className="filter-group">
              <label>Commission:</label>
              <button
                className={`filter-btn ${selectedCommission === null ? 'active' : ''}`}
                onClick={() => setSelectedCommission(null)}
              >
                All
              </button>
              {commissions.map((comm) => (
                <button
                  key={comm.commission}
                  className={`filter-btn ${selectedCommission === comm.commission ? 'active' : ''}`}
                  onClick={() => setSelectedCommission(selectedCommission === comm.commission ? null : comm.commission)}
                >
                  {comm.commission} ({comm.count})
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : members.length === 0 ? (
          <p>No council members found.</p>
        ) : (
          <div className="council-grid">
            {members.map((member) => (
              <div key={member.id} className="council-card">
                {member.image && (
                  <div className="council-image">
                    <img src={member.image} alt={member.name} />
                  </div>
                )}
                <div className="council-info">
                  <h3>{member.name}</h3>
                  <p className="council-role">{member.role}</p>
                  {member.dimension && <p className="council-dimension">Dimension: {member.dimension}</p>}
                  {member.commission && <p className="council-commission">Commission: {member.commission}</p>}
                  {member.bio && <p className="council-bio">{member.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Council;

