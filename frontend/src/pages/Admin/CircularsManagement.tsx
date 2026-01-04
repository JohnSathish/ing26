import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './Management.css';

interface Circular {
  id: number;
  title: string;
  month: number;
  year: number;
  file_path: string;
  description: string;
  is_active: boolean;
}

function CircularsManagement() {
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Circular | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    file_path: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadCirculars();
  }, []);

  const loadCirculars = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Circular[] }>(
        API_ENDPOINTS.CIRCULARS.LIST
      );
      if (response.success) {
        setCirculars(response.data);
      }
    } catch (error) {
      console.error('Failed to load circulars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiPut(`${API_ENDPOINTS.CIRCULARS.UPDATE}?id=${editing.id}`, {
          ...formData,
          id: editing.id,
        });
      } else {
        await apiPost(API_ENDPOINTS.CIRCULARS.CREATE, formData);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadCirculars();
    } catch (error: any) {
      alert(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this circular?')) {
      return;
    }
    try {
      await apiDelete(`${API_ENDPOINTS.CIRCULARS.DELETE}?id=${id}`);
      loadCirculars();
    } catch (error: any) {
      alert(error.message || 'Delete failed');
    }
  };

  const handleEdit = (circular: Circular) => {
    setEditing(circular);
    setFormData({
      title: circular.title,
      month: circular.month,
      year: circular.year,
      file_path: circular.file_path || '',
      description: circular.description || '',
      is_active: circular.is_active,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      file_path: '',
      description: '',
      is_active: true,
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
          <h1>Circulars Management</h1>
          <button onClick={() => { setShowForm(true); setEditing(null); resetForm(); }} className="btn-primary">
            Add New
          </button>
        </div>

        {showForm && (
          <div className="form-modal">
            <div className="form-content">
              <h2>{editing ? 'Edit' : 'Create'} Circular</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Month *</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    required
                  >
                    {monthNames.map((name, index) => (
                      <option key={index + 1} value={index + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    min="2000"
                    max="2100"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>File Path (PDF URL)</label>
                  <input
                    type="text"
                    value={formData.file_path}
                    onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
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
                <th>Title</th>
                <th>Month/Year</th>
                <th>File</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {circulars.map((circular) => (
                <tr key={circular.id}>
                  <td>{circular.title}</td>
                  <td>{monthNames[circular.month - 1]} {circular.year}</td>
                  <td>{circular.file_path ? 'Yes' : 'No'}</td>
                  <td>{circular.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button onClick={() => handleEdit(circular)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(circular.id)} className="btn-delete">Delete</button>
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

export default CircularsManagement;

