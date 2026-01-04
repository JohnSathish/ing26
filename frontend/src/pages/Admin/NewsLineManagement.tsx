import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './Management.css';

interface NewsLineIssue {
  id: number;
  title: string;
  month: number;
  year: number;
  cover_image: string;
  pdf_path: string;
  qr_code_url: string;
  description: string;
  is_active: boolean;
}

function NewsLineManagement() {
  const [issues, setIssues] = useState<NewsLineIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NewsLineIssue | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    cover_image: '',
    pdf_path: '',
    qr_code_url: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: NewsLineIssue[] }>(
        API_ENDPOINTS.NEWSLINE.LIST
      );
      if (response.success) {
        setIssues(response.data);
      }
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiPut(`${API_ENDPOINTS.NEWSLINE.UPDATE}?id=${editing.id}`, {
          ...formData,
          id: editing.id,
        });
      } else {
        await apiPost(API_ENDPOINTS.NEWSLINE.CREATE, formData);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadIssues();
    } catch (error: any) {
      alert(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this NewsLine issue?')) {
      return;
    }
    try {
      await apiDelete(`${API_ENDPOINTS.NEWSLINE.DELETE}?id=${id}`);
      loadIssues();
    } catch (error: any) {
      alert(error.message || 'Delete failed');
    }
  };

  const handleEdit = (issue: NewsLineIssue) => {
    setEditing(issue);
    setFormData({
      title: issue.title,
      month: issue.month,
      year: issue.year,
      cover_image: issue.cover_image || '',
      pdf_path: issue.pdf_path || '',
      qr_code_url: issue.qr_code_url || '',
      description: issue.description || '',
      is_active: issue.is_active,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      cover_image: '',
      pdf_path: '',
      qr_code_url: '',
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
          <h1>NewsLine Management</h1>
          <button onClick={() => { setShowForm(true); setEditing(null); resetForm(); }} className="btn-primary">
            Add New
          </button>
        </div>

        {showForm && (
          <div className="form-modal">
            <div className="form-content">
              <h2>{editing ? 'Edit' : 'Create'} NewsLine Issue</h2>
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
                  <label>Cover Image URL</label>
                  <input
                    type="text"
                    value={formData.cover_image}
                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>PDF Path</label>
                  <input
                    type="text"
                    value={formData.pdf_path}
                    onChange={(e) => setFormData({ ...formData, pdf_path: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>QR Code URL</label>
                  <input
                    type="text"
                    value={formData.qr_code_url}
                    onChange={(e) => setFormData({ ...formData, qr_code_url: e.target.value })}
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
                <th>PDF</th>
                <th>QR Code</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id}>
                  <td>{issue.title}</td>
                  <td>{monthNames[issue.month - 1]} {issue.year}</td>
                  <td>{issue.pdf_path ? 'Yes' : 'No'}</td>
                  <td>{issue.qr_code_url ? 'Yes' : 'No'}</td>
                  <td>{issue.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button onClick={() => handleEdit(issue)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(issue.id)} className="btn-delete">Delete</button>
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

export default NewsLineManagement;

