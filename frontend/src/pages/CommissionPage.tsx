import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import { getImageUrl } from '../utils/imageUtils';
import './CommissionPage.css';

interface CouncilMember {
  id: number;
  name: string;
  role: string;
  image: string;
  bio: string;
  dimension: string;
  commission: string;
}

interface CommissionInfo {
  [key: string]: {
    title: string;
    description: string;
  };
}

const commissionInfo: CommissionInfo = {
  'school-education': {
    title: 'School Education (DBSEM)',
    description: 'Commission for School Education and Don Bosco School Education Mission'
  },
  'higher-education': {
    title: 'Higher Education',
    description: 'Commission for Higher Education'
  },
  'non-formal': {
    title: 'Non-Formal',
    description: 'Commission for Non-Formal Education'
  },
  'youth-at-risk': {
    title: 'Youth at Risk (YaR)',
    description: 'Commission for Youth at Risk'
  },
  'migrants-desk': {
    title: "Migrant's Desk",
    description: 'Commission for Migrant\'s Desk'
  },
  'youth-centre': {
    title: 'Youth Centre / Oratories',
    description: 'Commission for Youth Centre and Oratories'
  },
  'scouts-guide': {
    title: 'Scouts & Guide / NCC/ NSS',
    description: 'Commission for Scouts & Guide, NCC, and NSS'
  },
  'hostel-boarding': {
    title: 'Hostel & Boarding',
    description: 'Commission for Hostel & Boarding'
  },
  'sports-academy': {
    title: 'Sports Academy',
    description: 'Commission for Sports Academy'
  },
  'formation': {
    title: 'Formation',
    description: 'Commission for Formation'
  },
  'salesian-family': {
    title: 'Salesian Family',
    description: 'Commission for Salesian Family'
  },
  'cooperators-adma': {
    title: 'Cooperators & ADMA',
    description: 'Commission for Cooperators & ADMA'
  },
  'past-pupil': {
    title: 'Past Pupil',
    description: 'Commission for Past Pupil'
  },
  'social-communication': {
    title: 'Social Communication',
    description: 'Commission for Social Communication'
  },
  'protector-minor': {
    title: 'Protector of Minor',
    description: 'Commission for Protector of Minor'
  },
  'ecology': {
    title: 'Ecology',
    description: 'Commission for Ecology'
  }
};

function CommissionPage() {
  const { commission } = useParams<{ commission: string }>();
  const [members, setMembers] = useState<CouncilMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (commission) {
      loadCommissionMembers();
    }
  }, [commission]);

  const loadCommissionMembers = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: CouncilMember[] }>(
        API_ENDPOINTS.COUNCIL.LIST
      );
      if (response.success && response.data) {
        // Map commission slug to commission name
        const info = commission ? commissionInfo[commission] : null;
        if (info) {
          // Filter members by commission name
          const filtered = response.data.filter(member => {
            const memberCommission = member.commission?.toLowerCase() || '';
            const commissionTitle = info.title.toLowerCase();
            return memberCommission.includes(commissionTitle.split('(')[0].trim()) ||
                   commissionTitle.includes(memberCommission);
          });
          setMembers(filtered);
        }
      }
    } catch (error) {
      console.error('Failed to load commission members:', error);
    } finally {
      setLoading(false);
    }
  };

  const info = commission ? commissionInfo[commission] : null;

  if (loading) {
    return (
      <div className="commission-page">
        <Header />
        <div className="commission-content-container">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="commission-page">
      <Header />
      <div className="commission-content-container">
        {info && (
          <>
            <h1>{info.title}</h1>
            <p className="description">{info.description}</p>
          </>
        )}
        {members.length > 0 ? (
          <div className="members-grid">
            {members.map((member) => (
              <div key={member.id} className="member-card">
                {member.image && (
                  <div className="member-image">
                    <img src={getImageUrl(member.image)} alt={member.name} />
                  </div>
                )}
                <div className="member-content">
                  <h3>{member.name}</h3>
                  {member.role && <p className="role">{member.role}</p>}
                  {member.bio && (
                    <div className="bio" dangerouslySetInnerHTML={{ __html: member.bio }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No members found for this commission.</p>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default CommissionPage;

