import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './Management.css';

interface CouncilMember {
  id: number;
  name: string;
  role: string;
  image: string;
  bio: string;
  dimension: string;
  commission: string;
  is_active: boolean;
  order_index: number;
}

function CouncilManagement() {
  const [members, setMembers] = useState<CouncilMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CouncilMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    image: '',
    bio: '',
    dimension: '',
    commission: '',
    is_active: true,
    order_index: 0,
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: CouncilMember[] }>(
        API_ENDPOINTS.COUNCIL.LIST
      );
      if (response.success) {
        setMembers(response.data);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiPut(`${API_ENDPOINTS.COUNCIL.UPDATE}?id=${editing.id}`, {
          ...formData,
          id: editing.id,
        });
      } else {
        await apiPost(API_ENDPOINTS.COUNCIL.CREATE, formData);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadMembers();
    } catch (error: any) {
      alert(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this council member?')) {
      return;
    }
    try {
      await apiDelete(`${API_ENDPOINTS.COUNCIL.DELETE}?id=${id}`);
      loadMembers();
    } catch (error: any) {
      alert(error.message || 'Delete failed');
    }
  };

  const handleEdit = (member: CouncilMember) => {
    setEditing(member);
    setFormData({
      name: member.name,
      role: member.role,
      image: member.image || '',
      bio: member.bio || '',
      dimension: member.dimension || '',
      commission: member.commission || '',
      is_active: member.is_active,
      order_index: member.order_index,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      image: '',
      bio: '',
      dimension: '',
      commission: '',
      is_active: true,
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
          <h1>Council Members Management</h1>
          <button onClick={() => { setShowForm(true); setEditing(null); resetForm(); }} className="btn-primary">
            Add New
          </button>
        </div>

        {showForm && (
          <div className="form-modal">
            <div className="form-content">
              <h2>{editing ? 'Edit' : 'Create'} Council Member</h2>
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
                  <label>Role *</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  />
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
                  <label>Dimension</label>
                  <input
                    type="text"
                    value={formData.dimension}
                    onChange={(e) => setFormData({ ...formData, dimension: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Commission</label>
                  <input
                    type="text"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
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
                <th>Role</th>
                <th>Dimension</th>
                <th>Commission</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.role}</td>
                  <td>{member.dimension || '-'}</td>
                  <td>{member.commission || '-'}</td>
                  <td>{member.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button onClick={() => handleEdit(member)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(member.id)} className="btn-delete">Delete</button>
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

export default CouncilManagement;

