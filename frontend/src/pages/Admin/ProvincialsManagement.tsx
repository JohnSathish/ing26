import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './Management.css';

interface Provincial {
  id: number;
  name: string;
  title: 'provincial' | 'vice_provincial' | 'economer' | 'secretary';
  image: string;
  bio: string;
  period_start: string;
  period_end: string;
  is_current: boolean;
  order_index: number;
}

function ProvincialsManagement() {
  const [provincials, setProvincials] = useState<Provincial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Provincial | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: 'provincial' as 'provincial' | 'vice_provincial' | 'economer' | 'secretary',
    image: '',
    bio: '',
    period_start: '',
    period_end: '',
    is_current: false,
    order_index: 0,
  });

  useEffect(() => {
    loadProvincials();
  }, []);

  const loadProvincials = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Provincial[] }>(
        API_ENDPOINTS.PROVINCIALS.LIST
      );
      if (response.success) {
        setProvincials(response.data);
      }
    } catch (error) {
      console.error('Failed to load provincials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiPut(`${API_ENDPOINTS.PROVINCIALS.UPDATE}?id=${editing.id}`, {
          ...formData,
          id: editing.id,
        });
      } else {
        await apiPost(API_ENDPOINTS.PROVINCIALS.CREATE, formData);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadProvincials();
    } catch (error: any) {
      alert(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this provincial?')) {
      return;
    }
    try {
      await apiDelete(`${API_ENDPOINTS.PROVINCIALS.DELETE}?id=${id}`);
      loadProvincials();
    } catch (error: any) {
      alert(error.message || 'Delete failed');
    }
  };

  const handleEdit = (provincial: Provincial) => {
    setEditing(provincial);
    setFormData({
      name: provincial.name,
      title: provincial.title,
      image: provincial.image || '',
      bio: provincial.bio || '',
      period_start: provincial.period_start || '',
      period_end: provincial.period_end || '',
      is_current: provincial.is_current,
      order_index: provincial.order_index,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: 'provincial',
      image: '',
      bio: '',
      period_start: '',
      period_end: '',
      is_current: false,
      order_index: 0,
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="management">
        <div className="management-header">
          <h1>Provincials Management</h1>
          <button onClick={() => { setShowForm(true); setEditing(null); resetForm(); }} className="btn-primary">
            Add New
          </button>
        </div>

        {showForm && (
          <div className="form-modal">
            <div className="form-content">
              <h2>{editing ? 'Edit' : 'Create'} Provincial</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Title *</label>
                  <select
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value as any })}
                    required
                  >
                    <option value="provincial">Provincial</option>
                    <option value="vice_provincial">Vice Provincial</option>
                    <option value="economer">Economer</option>
                    <option value="secretary">Secretary</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={6}
                  />
                </div>
                <div className="form-group">
                  <label>Period Start</label>
                  <input
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Period End</label>
                  <input
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Order Index</label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_current}
                      onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                    />
                    Current
                  </label>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Save</button>
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null); resetForm(); }} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Period</th>
                <th>Current</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {provincials.map((provincial) => (
                <tr key={provincial.id}>
                  <td>{provincial.name}</td>
                  <td>{provincial.title}</td>
                  <td>
                    {provincial.period_start
                      ? `${new Date(provincial.period_start).getFullYear()} - ${provincial.period_end ? new Date(provincial.period_end).getFullYear() : 'Present'}`
                      : '-'}
                  </td>
                  <td>{provincial.is_current ? 'Yes' : 'No'}</td>
                  <td>
                    <button onClick={() => handleEdit(provincial)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(provincial.id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default ProvincialsManagement;

