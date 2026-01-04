import { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { apiGet, apiPost, apiPut, apiDelete, apiUploadImage } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './Management.css';

interface HeroBanner {
  id: number;
  type: 'hero';
  title: string;
  subtitle: string;
  content: string;
  image: string;
  link_url: string;
  order_index: number;
  is_active: boolean;
}

function HeroSliderManagement() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HeroBanner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    image: '',
    link_url: '',
    order_index: 0,
    is_active: true,
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: HeroBanner[] }>(
        `${API_ENDPOINTS.BANNERS.LIST}?type=hero`
      );
      if (response.success) {
        // Sort by order_index
        const sorted = [...response.data].sort((a, b) => 
          (a.order_index || 0) - (b.order_index || 0)
        );
        setBanners(sorted);
      }
    } catch (error) {
      console.error('Failed to load hero banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bannerData = {
        ...formData,
        type: 'hero',
      };

      if (editing) {
        await apiPut(`${API_ENDPOINTS.BANNERS.UPDATE}?id=${editing.id}`, bannerData);
      } else {
        await apiPost(API_ENDPOINTS.BANNERS.CREATE, bannerData);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadBanners();
      alert('Hero slider saved successfully!');
    } catch (error: any) {
      alert(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this hero slider?')) {
      return;
    }
    try {
      await apiDelete(`${API_ENDPOINTS.BANNERS.DELETE}?id=${id}`);
      loadBanners();
      alert('Hero slider deleted successfully!');
    } catch (error: any) {
      alert(error.message || 'Delete failed');
    }
  };

  const handleEdit = (banner: HeroBanner) => {
    setEditing(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      content: banner.content || '',
      image: banner.image || '',
      link_url: banner.link_url || '',
      order_index: banner.order_index || 0,
      is_active: banner.is_active !== undefined ? banner.is_active : true,
    });
    if (banner.image) {
      setImagePreview(getImageUrl(banner.image));
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
    setImagePreview(getImageUrl(url));
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: '' });
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getImageUrl = (image: string | null): string => {
    if (!image) return '';
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    if (image.startsWith('/uploads/') || image.startsWith('uploads/')) {
      return image.startsWith('/') ? image : '/' + image;
    }
    return '/uploads/images/' + image;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      content: '',
      image: '',
      link_url: '',
      order_index: 0,
      is_active: true,
    });
    setImagePreview('');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="management-page">
        <div className="page-header">
          <h1>Hero Slider Management</h1>
          <button
            className="btn-primary"
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) {
                resetForm();
                setEditing(null);
              }
            }}
          >
            {showForm ? 'Cancel' : 'Add New Slider'}
          </button>
        </div>

        {showForm && (
          <div className="form-page-content">
            <div className="full-page-form">
              <h2 className="form-page-title">{editing ? 'Edit' : 'Add'} Hero Slider</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Enter slider title"
                  />
                </div>

                <div className="form-group">
                  <label>Slider Image *</label>
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
                        <img
                          src={imagePreview}
                          alt="Preview"
                          onError={(e) => {
                            console.error('Failed to load image preview:', imagePreview);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="link_url">Link URL (Optional)</label>
                  <input
                    type="url"
                    id="link_url"
                    name="link_url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://example.com"
                  />
                  <small className="field-help-text">Optional: Link to navigate when slider is clicked</small>
                </div>

                <div className="form-group">
                  <label htmlFor="order_index">Display Order</label>
                  <input
                    type="number"
                    id="order_index"
                    name="order_index"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                    min="0"
                    placeholder="0"
                  />
                  <small className="field-help-text">Lower numbers appear first in the slider</small>
                </div>

                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label htmlFor="is_active">Active (Show on homepage)</label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    {editing ? 'Update Slider' : 'Save Slider'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowForm(false);
                      setEditing(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!showForm && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Title</th>
                  <th>Image</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                      No hero sliders found. Click "Add New Slider" to create one.
                    </td>
                  </tr>
                ) : (
                  banners.map((banner) => (
                    <tr key={banner.id}>
                      <td>{banner.order_index}</td>
                      <td>
                        <strong>{banner.title}</strong>
                      </td>
                      <td>
                        {banner.image && (
                          <img
                            src={getImageUrl(banner.image)}
                            alt={banner.title}
                            className="table-thumbnail"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-image.jpg';
                            }}
                          />
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${banner.is_active ? 'active' : 'inactive'}`}>
                          {banner.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(banner)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(banner.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default HeroSliderManagement;

