import { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { apiGet, apiPost, apiPut, apiDelete, apiUploadImage } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './Management.css';

interface Banner {
  id: number;
  type: 'hero' | 'flash_news';
  title: string;
  subtitle: string;
  content: string;
  image: string;
  link_url: string;
  order_index: number;
  is_active: boolean;
}

function BannersManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [filteredBanners, setFilteredBanners] = useState<Banner[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'hero' | 'flash_news'>('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    type: 'hero' as 'hero' | 'flash_news',
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
      const response = await apiGet<{ success: boolean; data: Banner[] }>(
        API_ENDPOINTS.BANNERS.LIST
      );
      if (response.success) {
        setBanners(response.data);
        applyFilter(response.data, filterType);
      }
    } catch (error) {
      console.error('Failed to load banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (bannerList: Banner[], type: 'all' | 'hero' | 'flash_news') => {
    if (type === 'all') {
      setFilteredBanners(bannerList);
    } else {
      setFilteredBanners(bannerList.filter(banner => banner.type === type));
    }
  };

  useEffect(() => {
    applyFilter(banners, filterType);
  }, [filterType, banners]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiPut(`${API_ENDPOINTS.BANNERS.UPDATE}?id=${editing.id}`, {
          ...formData,
          id: editing.id,
        });
      } else {
        await apiPost(API_ENDPOINTS.BANNERS.CREATE, formData);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      showSuccess(editing ? 'Banner updated successfully!' : 'Banner created successfully!');
      loadBanners();
    } catch (error: any) {
      showError(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this banner?')) {
      return;
    }
    try {
      await apiDelete(`${API_ENDPOINTS.BANNERS.DELETE}?id=${id}`);
      showSuccess('Banner deleted successfully!');
      loadBanners();
    } catch (error: any) {
      showError(error.message || 'Delete failed');
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
      setFormData({ ...formData, image: result.url });
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
    setFormData({ ...formData, image: '' });
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditing(banner);
    setFormData({
      type: banner.type,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      content: banner.content || '',
      image: banner.image || '',
      link_url: banner.link_url || '',
      order_index: banner.order_index,
      is_active: banner.is_active,
    });
    setImagePreview(banner.image || '');
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'hero',
      title: '',
      subtitle: '',
      content: '',
      image: '',
      link_url: '',
      order_index: 0,
      is_active: true,
    });
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          <h1>Banners Management</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'hero' | 'flash_news')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid #e5e7eb',
                fontSize: '0.9375rem',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Banners</option>
              <option value="hero">Hero Slider</option>
              <option value="flash_news">Flash News</option>
            </select>
            <button onClick={() => { setShowForm(true); setEditing(null); resetForm(); }} className="btn-primary">
              Add New
            </button>
          </div>
        </div>

        {showForm && (
          <div className="form-modal">
            <div className="form-content">
              <h2>{editing ? 'Edit' : 'Create'} Banner</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'hero' | 'flash_news' })}
                    required
                  >
                    <option value="hero">Hero</option>
                    <option value="flash_news">Flash News</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Subtitle</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>Image</label>
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
                        value={formData.image}
                        onChange={(e) => {
                          setFormData({ ...formData, image: e.target.value });
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    
                    {/* Image Preview */}
                    {(imagePreview || formData.image) && (
                      <div className="image-preview">
                        <img 
                          src={imagePreview || formData.image} 
                          alt="Preview" 
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
                  <label>Link URL</label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
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
                <th>Type</th>
                <th>Title</th>
                <th>Content</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanners.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    <EmptyState
                      title="No Banners Found"
                      message={`No ${filterType === 'all' ? '' : filterType === 'hero' ? 'hero ' : 'flash news '}banners found. Create your first banner to get started.`}
                      icon="🎯"
                      action={{
                        label: "Create Banner",
                        onClick: () => { setShowForm(true); setEditing(null); resetForm(); }
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredBanners.map((banner) => (
                  <tr key={banner.id}>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: banner.type === 'hero' ? '#dbeafe' : '#fef3c7',
                        color: banner.type === 'hero' ? '#1e40af' : '#92400e',
                      }}>
                        {banner.type === 'hero' ? 'Hero' : 'Flash News'}
                      </span>
                    </td>
                    <td>{banner.title || '-'}</td>
                    <td>{banner.content ? banner.content.substring(0, 50) + '...' : '-'}</td>
                    <td>{banner.order_index}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: banner.is_active ? '#d1fae5' : '#fee2e2',
                        color: banner.is_active ? '#065f46' : '#991b1b',
                      }}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleEdit(banner)} className="btn-edit">Edit</button>
                      <button onClick={() => handleDelete(banner.id)} className="btn-delete">Delete</button>
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

export default BannersManagement;


