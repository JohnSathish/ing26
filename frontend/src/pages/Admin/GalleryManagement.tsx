import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './Management.css';

interface GalleryItem {
  id: number;
  title: string;
  type: 'photo' | 'video';
  file_path: string;
  thumbnail: string;
  description: string;
  category: string;
  is_featured: boolean;
  order_index: number;
}

function GalleryManagement() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'photo' as 'photo' | 'video',
    file_path: '',
    thumbnail: '',
    description: '',
    category: '',
    is_featured: false,
    order_index: 0,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: GalleryItem[] }>(
        API_ENDPOINTS.GALLERY.LIST
      );
      if (response.success) {
        setItems(response.data);
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiPut(`${API_ENDPOINTS.GALLERY.UPDATE}?id=${editing.id}`, {
          ...formData,
          id: editing.id,
        });
      } else {
        await apiPost(API_ENDPOINTS.GALLERY.CREATE, formData);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadItems();
    } catch (error: any) {
      alert(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this gallery item?')) {
      return;
    }
    try {
      await apiDelete(`${API_ENDPOINTS.GALLERY.DELETE}?id=${id}`);
      loadItems();
    } catch (error: any) {
      alert(error.message || 'Delete failed');
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setEditing(item);
    setFormData({
      title: item.title,
      type: item.type,
      file_path: item.file_path,
      thumbnail: item.thumbnail || '',
      description: item.description || '',
      category: item.category || '',
      is_featured: item.is_featured,
      order_index: item.order_index,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'photo',
      file_path: '',
      thumbnail: '',
      description: '',
      category: '',
      is_featured: false,
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
          <h1>Gallery Management</h1>
          <button onClick={() => { setShowForm(true); setEditing(null); resetForm(); }} className="btn-primary">
            Add New
          </button>
        </div>

        {showForm && (
          <div className="form-modal">
            <div className="form-content">
              <h2>{editing ? 'Edit' : 'Create'} Gallery Item</h2>
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
                  <label>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'photo' | 'video' })}
                    required
                  >
                    <option value="photo">Photo</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>File Path (URL) *</label>
                  <input
                    type="text"
                    value={formData.file_path}
                    onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Thumbnail URL</label>
                  <input
                    type="text"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
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
                  <label>Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    />
                    Featured
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
                <th>Type</th>
                <th>Category</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.type}</td>
                  <td>{item.category || '-'}</td>
                  <td>{item.is_featured ? 'Yes' : 'No'}</td>
                  <td>
                    <button onClick={() => handleEdit(item)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="btn-delete">Delete</button>
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

export default GalleryManagement;

