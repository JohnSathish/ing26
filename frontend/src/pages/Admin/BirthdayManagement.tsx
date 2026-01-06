import { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { apiGet, apiPost, apiPut, apiDelete, apiUploadImage } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import EmptyState from '../../components/EmptyState/EmptyState';
import './Management.css';

interface BirthdayWish {
  id: number;
  name: string;
  date_of_birth: string;
  message: string;
  profile_image: string;
  background_color: string;
  is_active: boolean;
}

function BirthdayManagement() {
  const [wishes, setWishes] = useState<BirthdayWish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BirthdayWish | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    message: '',
    profile_image: '',
    background_color: '#6B46C1',
    is_active: true,
  });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadWishes();
  }, []);

  const loadWishes = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: BirthdayWish[] }>(
        API_ENDPOINTS.BIRTHDAY.LIST
      );
      if (response.success) {
        setWishes(response.data);
      }
    } catch (error) {
      console.error('Failed to load wishes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiPut(`${API_ENDPOINTS.BIRTHDAY.UPDATE}?id=${editing.id}`, {
          ...formData,
          id: editing.id,
        });
      } else {
        await apiPost(API_ENDPOINTS.BIRTHDAY.CREATE, formData);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      showSuccess(editing ? 'Birthday wish updated successfully!' : 'Birthday wish created successfully!');
      loadWishes();
    } catch (error: any) {
      showError(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this birthday wish?')) {
      return;
    }
    try {
      await apiDelete(`${API_ENDPOINTS.BIRTHDAY.DELETE}?id=${id}`);
      showSuccess('Birthday wish deleted successfully!');
      loadWishes();
    } catch (error: any) {
      showError(error.message || 'Delete failed');
    }
  };

  const handleEdit = (wish: BirthdayWish) => {
    setEditing(wish);
    setFormData({
      name: wish.name,
      date_of_birth: wish.date_of_birth,
      message: wish.message || '',
      profile_image: wish.profile_image || '',
      background_color: wish.background_color,
      is_active: wish.is_active,
    });
    setImagePreview(wish.profile_image || '');
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      date_of_birth: '',
      message: '',
      profile_image: '',
      background_color: '#6B46C1',
      is_active: true,
    });
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const result = await apiUploadImage(file);
      setFormData({ ...formData, profile_image: result.url });
      showSuccess('Image uploaded successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to upload image');
      setImagePreview('');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, profile_image: '' });
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner message="Loading birthday wishes..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="management">
        <div className="management-header">
          <h1>Birthday Wishes Management</h1>
          <button onClick={() => { setShowForm(true); setEditing(null); resetForm(); }} className="btn-primary">
            Add New
          </button>
        </div>

        {showForm && (
          <div className="form-modal">
            <div className="form-content">
              <h2>{editing ? 'Edit' : 'Create'} Birthday Wish</h2>
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
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>Birthday Photo</label>
                  <div className="image-upload-section">
                    {/* Upload Option */}
                    <div className="upload-option">
                      <label className="upload-label">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          disabled={uploading}
                          style={{ display: 'none' }}
                        />
                        <span className="upload-button">
                          {uploading ? 'Uploading...' : 'Choose Image File'}
                        </span>
                      </label>
                      <span className="upload-hint">Max 5MB (JPEG, PNG, GIF, WebP)</span>
                    </div>
                    
                    {/* OR Divider */}
                    <div className="upload-divider">
                      <span>OR</span>
                    </div>
                    
                    {/* URL Option */}
                    <div className="url-option">
                      <label>Image URL</label>
                      <input
                        type="text"
                        value={formData.profile_image}
                        onChange={(e) => {
                          setFormData({ ...formData, profile_image: e.target.value });
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://example.com/image.jpg or /uploads/images/image.jpg"
                      />
                    </div>
                    
                    {/* Image Preview */}
                    {(imagePreview || formData.profile_image) && (
                      <div className="image-preview">
                        <img 
                          src={imagePreview || formData.profile_image} 
                          alt="Profile Preview" 
                          onError={() => setImagePreview('')}
                        />
                        <button 
                          type="button" 
                          onClick={handleRemoveImage}
                          className="remove-image-btn"
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Background Color</label>
                  <input
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
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
                <th>Date of Birth</th>
                <th>Message</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {wishes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                    <EmptyState
                      title="No Birthday Wishes"
                      message="No birthday wishes found. Create your first birthday wish to get started."
                      icon="🎂"
                      action={{
                        label: "Create Birthday Wish",
                        onClick: () => { setShowForm(true); setEditing(null); resetForm(); }
                      }}
                    />
                  </td>
                </tr>
              ) : (
                wishes.map((wish) => (
                  <tr key={wish.id}>
                    <td>{wish.name}</td>
                    <td>{new Date(wish.date_of_birth).toLocaleDateString()}</td>
                    <td>{wish.message || '-'}</td>
                    <td>{wish.is_active ? 'Active' : 'Inactive'}</td>
                    <td>
                      <button onClick={() => handleEdit(wish)} className="btn-edit">Edit</button>
                      <button onClick={() => handleDelete(wish.id)} className="btn-delete">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default BirthdayManagement;


