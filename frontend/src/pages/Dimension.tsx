import { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './Dimension.css';

interface Dimension {
  dimension: string;
  count: number;
  members: Array<{
    id: number;
    name: string;
    role: string;
    image: string;
  }>;
}

function Dimension() {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDimensions();
  }, []);

  const loadDimensions = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: any[]; dimensions: Array<{ dimension: string; count: number }> }>(
        API_ENDPOINTS.COUNCIL.LIST
      );
      if (response.success && response.dimensions) {
        // Group members by dimension
        const dimensionMap: { [key: string]: Dimension } = {};
        response.dimensions.forEach((dim) => {
          dimensionMap[dim.dimension] = {
            dimension: dim.dimension,
            count: dim.count,
            members: response.data?.filter((m: any) => m.dimension === dim.dimension) || []
          };
        });
        setDimensions(Object.values(dimensionMap));
      }
    } catch (error) {
      console.error('Failed to load dimensions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dimension-page">
        <Header />
        <div className="dimension-content-container">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dimension-page">
      <Header />
      <div className="dimension-content-container">
        <h1>Dimensions</h1>
        <p className="description">Organizational dimensions of the Province</p>
        {dimensions.length > 0 ? (
          <div className="dimensions-list">
            {dimensions.map((dim, index) => (
              <div key={index} className="dimension-section">
                <h2>{dim.dimension}</h2>
                <p className="count">{dim.count} member(s)</p>
                {dim.members.length > 0 && (
                  <div className="members-list">
                    {dim.members.map((member) => (
                      <div key={member.id} className="member-item">
                        <span className="member-name">{member.name}</span>
                        {member.role && <span className="member-role"> - {member.role}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No dimensions information available at this time.</p>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Dimension;

