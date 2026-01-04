import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { apiGet } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './Dashboard.css';

interface Stats {
  birthday_wishes: number;
  news: number;
  published_news: number;
  houses: number;
  banners: number;
  recent_activity: number;
}

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ success: boolean; stats: Stats }>(API_ENDPOINTS.DASHBOARD.STATS)
      .then((response) => {
        if (response.success) {
          setStats(response.stats);
        }
      })
      .catch((error) => {
        console.error('Failed to load stats:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="dashboard">
        <h1>Dashboard</h1>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Birthday Wishes</h3>
            <p className="stat-number">{stats?.birthday_wishes || 0}</p>
          </div>
          <div className="stat-card">
            <h3>News Articles</h3>
            <p className="stat-number">{stats?.news || 0}</p>
            <p className="stat-sub">Published: {stats?.published_news || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Houses</h3>
            <p className="stat-number">{stats?.houses || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Banners</h3>
            <p className="stat-number">{stats?.banners || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Recent Activity</h3>
            <p className="stat-number">{stats?.recent_activity || 0}</p>
            <p className="stat-sub">Last 7 days</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;


