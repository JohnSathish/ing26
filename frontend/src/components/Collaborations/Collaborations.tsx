import { useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { getImageUrl } from '../../utils/imageUtils';
import './Collaborations.css';

interface Collaboration {
  id: number;
  name: string;
  logo: string;
  website: string;
  description: string;
  order_index: number;
}

function Collaborations() {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);

  useEffect(() => {
    loadCollaborations();
  }, []);

  const loadCollaborations = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Collaboration[] }>(
        API_ENDPOINTS.COLLABORATIONS.LIST
      );
      if (response.success && response.data) {
        // Filter active and sort by order_index
        const activeCollaborations = response.data
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        setCollaborations(activeCollaborations);
      }
    } catch (error) {
      console.error('Failed to load collaborations:', error);
    }
  };

  if (collaborations.length === 0) {
    return null;
  }

  // Duplicate logos for seamless infinite scroll
  const duplicatedCollaborations = [...collaborations, ...collaborations];

  return (
    <section className="collaborations">
      <div className="container">
        <h2 className="section-title">Our Collaborations</h2>
        <div className="collaborations-wrapper">
          <div className="collaborations-track">
            {duplicatedCollaborations.map((collab, index) => (
              <div key={`${collab.id}-${index}`} className="collaboration-item">
                {collab.website ? (
                  <a
                    href={collab.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="collaboration-link"
                    title={collab.name}
                  >
                    <img
                      src={getImageUrl(collab.logo)}
                      alt={collab.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </a>
                ) : (
                  <div className="collaboration-link" title={collab.name}>
                    <img
                      src={getImageUrl(collab.logo)}
                      alt={collab.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Collaborations;

