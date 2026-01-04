import { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { apiGet, apiPost, apiPut, apiDelete, apiUploadImage } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './Management.css';

interface House {
  id: number;
  name: string;
  description: string;
  location: string;
  image: string;
  order_index: number;
  is_active: boolean;
}

function HousesManagement() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<House | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    image: '',
    order_index: 0,
    is_active: true,
  });

  useEffect(() => {
    loadHouses();
  }, []);

  const loadHouses = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: House[] }>(
        API_ENDPOINTS.HOUSES.LIST
      );
      if (response.success) {
        setHouses(response.data);
      }
    } catch (error) {
      console.error('Failed to load houses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiPut(`${API_ENDPOINTS.HOUSES.UPDATE}?id=${editing.id}`, {
          ...formData,
          id: editing.id,
        });
      } else {
        await apiPost(API_ENDPOINTS.HOUSES.CREATE, formData);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadHouses();
    } catch (error: any) {
      alert(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this house?')) {
      return;
    }
    try {
      await apiDelete(`${API_ENDPOINTS.HOUSES.DELETE}?id=${id}`);
      loadHouses();
    } catch (error: any) {
      alert(error.message || 'Delete failed');
    }
  };

  const handleEdit = (house: House) => {
    setEditing(house);
    setFormData({
      name: house.name,
      description: house.description || '',
      location: house.location || '',
      image: house.image || '',
      order_index: house.order_index,
      is_active: house.is_active,
    });
    if (house.image) {
      setImagePreview(house.image);
    }
    setShowForm(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const uploadResponse = await apiUploadImage(file);
      const imageUrl = uploadResponse.url || uploadResponse.filename || '';
      if (imageUrl) {
        const formattedUrl = imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl;
        setFormData({ ...formData, image: formattedUrl });
        setImagePreview(formattedUrl);
      } else {
        alert('Image upload failed: No URL returned');
      }
    } catch (error: any) {
      alert(error.message || 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, image: url });
    setImagePreview(url);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: '' });
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      image: '',
      order_index: 0,
      is_active: true,
    });
    setImagePreview('');
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
          <h1>Houses Management</h1>
          <button onClick={() => { setShowForm(true); setEditing(null); resetForm(); }} className="btn-primary">
            Add New
          </button>
        </div>

        {showForm && (
          <div className="form-modal">
            <div className="form-content">
              <h2>{editing ? 'Edit' : 'Create'} House</h2>
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
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>
                    Location
                    <span className="field-hint" title="Enter the city, district, or region where this house/diocese is located (e.g., 'Guwahati', 'Diphu', 'Bongaigaon District')">
                      ℹ️
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Guwahati, Diphu, Bongaigaon District"
                  />
                  <small className="field-help-text">The geographical location or district where this house/diocese is situated</small>
                </div>
                <div className="form-group">
                  <label>House Image</label>
                  <div className="image-upload-section">
                    <div className="image-upload-controls">
                      <div className="file-input-wrapper">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          disabled={uploading}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? 'Uploading...' : 'Upload Image'}
                        </button>
                      </div>
                      <span className="or-text">OR</span>
                      <input
                        type="text"
                        placeholder="Enter image URL"
                        value={formData.image}
                        onChange={(e) => handleImageUrlChange(e.target.value)}
                        className="url-input"
                      />
                      {imagePreview && (
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={handleRemoveImage}
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="image-preview">
                        <img src={imagePreview.startsWith('http') ? imagePreview : (imagePreview.startsWith('/') ? imagePreview : '/' + imagePreview)} alt="Preview" onError={(e) => {
                          console.error('Image preview failed:', imagePreview);
                          e.currentTarget.style.display = 'none';
                        }} />
                      </div>
                    )}
                  </div>
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
                <th>Location</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {houses.map((house) => (
                <tr key={house.id}>
                  <td>{house.name}</td>
                  <td>{house.location || '-'}</td>
                  <td>{house.order_index}</td>
                  <td>{house.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button onClick={() => handleEdit(house)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(house.id)} className="btn-delete">Delete</button>
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

export default HousesManagement;


