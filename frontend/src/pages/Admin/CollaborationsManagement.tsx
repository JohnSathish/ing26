import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './Management.css';

interface Collaboration {
  id: number;
  name: string;
  logo: string;
  website: string;
  description: string;
  order_index: number;
  is_active: boolean;
}

function CollaborationsManagement() {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Collaboration | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    website: '',
    description: '',
    order_index: 0,
    is_active: true,
  });

  useEffect(() => {
    loadCollaborations();
  }, []);

  const loadCollaborations = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Collaboration[] }>(
        API_ENDPOINTS.COLLABORATIONS.LIST
      );
      if (response.success) {
        setCollaborations(response.data);
      }
    } catch (error) {
      console.error('Failed to load collaborations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiPut(`${API_ENDPOINTS.COLLABORATIONS.UPDATE}?id=${editing.id}`, {
          ...formData,
          id: editing.id,
        });
      } else {
        await apiPost(API_ENDPOINTS.COLLABORATIONS.CREATE, formData);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadCollaborations();
    } catch (error: any) {
      alert(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this collaboration?')) {
      return;
    }
    try {
      await apiDelete(`${API_ENDPOINTS.COLLABORATIONS.DELETE}?id=${id}`);
      loadCollaborations();
    } catch (error: any) {
      alert(error.message || 'Delete failed');
    }
  };

  const handleEdit = (collaboration: Collaboration) => {
    setEditing(collaboration);
    setFormData({
      name: collaboration.name,
      logo: collaboration.logo,
      website: collaboration.website || '',
      description: collaboration.description || '',
      order_index: collaboration.order_index,
      is_active: collaboration.is_active,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      logo: '',
      website: '',
      description: '',
      order_index: 0,
      is_active: true,
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
          <h1>Collaborations Management</h1>
          <button onClick={() => { setShowForm(true); setEditing(null); resetForm(); }} className="btn-primary">
            Add New
          </button>
        </div>

        {showForm && (
          <div className="form-modal">
            <div className="form-content">
              <h2>{editing ? 'Edit' : 'Create'} Collaboration</h2>
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
                  <label>Logo URL *</label>
                  <input
                    type="text"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Website URL</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
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
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Active
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
                <th>Logo</th>
                <th>Website</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collaborations.map((collab) => (
                <tr key={collab.id}>
                  <td>{collab.name}</td>
                  <td>{collab.logo ? <img src={collab.logo} alt={collab.name} style={{ width: '50px', height: '50px', objectFit: 'contain' }} /> : '-'}</td>
                  <td>{collab.website ? <a href={collab.website} target="_blank" rel="noopener noreferrer">{collab.website}</a> : '-'}</td>
                  <td>{collab.order_index}</td>
                  <td>{collab.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button onClick={() => handleEdit(collab)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(collab.id)} className="btn-delete">Delete</button>
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

export default CollaborationsManagement;

