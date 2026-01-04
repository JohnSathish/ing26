import { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { apiGet, apiPost, apiPut, apiUploadImage } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './Management.css';

interface Strenna {
  id: number;
  year: string;
  title: string;
  content: string;
  image: string | null;
  is_active: boolean;
}

function StrennaManagement() {
  const [strenna, setStrenna] = useState<Strenna | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    year: '2025',
    title: 'STRENNA 2025',
    content: 'As I do every year in July, I am sending out a simple outline presenting the theme of the Strenna for the new year. In this way, those who have to plan the new educative and pastoral year starting in September in some countries, will already find some guidance. This time the presentation is written "with four hands" (like when two people play a piece of music together on the same piano). In fact it is the Rector Major and his Vicar who have sketched out these lines which later (certainly starting from October and November) Father Stefano Martoglio himself.',
    image: '',
    is_active: true,
  });

  useEffect(() => {
    loadStrenna();
  }, []);

  const loadStrenna = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Strenna | null }>(
        API_ENDPOINTS.STRENNA.LIST
      );
      if (response.success && response.data) {
        setStrenna(response.data);
        setFormData({
          year: response.data.year,
          title: response.data.title,
          content: response.data.content,
          image: response.data.image || '',
          is_active: response.data.is_active,
        });
        if (response.data.image) {
          const imageUrl = typeof response.data.image === 'string' ? response.data.image : '';
          setImagePreview(imageUrl);
        }
      }
    } catch (error) {
      console.error('Failed to load STRENNA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (strenna) {
        await apiPut(`${API_ENDPOINTS.STRENNA.UPDATE}?id=${strenna.id}`, formData);
      } else {
        await apiPost(API_ENDPOINTS.STRENNA.CREATE, formData);
      }
      setShowForm(false);
      resetForm();
      loadStrenna();
      alert('STRENNA saved successfully!');
    } catch (error: any) {
      alert(error.message || 'Operation failed');
    }
  };

  const getImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    // If it's already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If it starts with /, return as is
    if (url.startsWith('/')) {
      return url;
    }
    // Otherwise, prepend /uploads/images/
    return '/uploads/images/' + url;
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
        // Ensure URL is properly formatted
        const formattedUrl = getImageUrl(imageUrl);
        setFormData({ ...formData, image: formattedUrl });
        setImagePreview(formattedUrl);
      } else {
        alert('Image upload failed: No URL returned');
      }
    } catch (error: any) {
      alert(error.message || 'Image upload failed');
    } finally {
      setUploading(false);
      // Don't clear the file input - keep it so user can see what was selected
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
    if (strenna) {
      setFormData({
        year: strenna.year,
        title: strenna.title,
        content: strenna.content,
        image: strenna.image || '',
        is_active: strenna.is_active,
      });
      const imageUrl = typeof strenna.image === 'string' ? strenna.image : '';
      setImagePreview(imageUrl);
    } else {
      setFormData({
        year: '2025',
        title: 'STRENNA 2025',
        content: 'As I do every year in July, I am sending out a simple outline presenting the theme of the Strenna for the new year. In this way, those who have to plan the new educative and pastoral year starting in September in some countries, will already find some guidance. This time the presentation is written "with four hands" (like when two people play a piece of music together on the same piano). In fact it is the Rector Major and his Vicar who have sketched out these lines which later (certainly starting from October and November) Father Stefano Martoglio himself.',
        image: '',
        is_active: true,
      });
      setImagePreview('');
    }
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
          <h1>STRENNA Management</h1>
          <button
            className="btn-primary"
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) {
                resetForm();
              }
            }}
          >
            {showForm ? 'Cancel' : strenna ? 'Edit STRENNA' : 'Add STRENNA'}
          </button>
        </div>

        {showForm && (
          <div className="form-page-content">
            <div className="full-page-form">
              <form onSubmit={handleSubmit} className="management-form">
                <div className="form-group">
                  <label>Year *</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                    placeholder="e.g., 2025"
                  />
                </div>

                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., STRENNA 2025"
                  />
                </div>

                <div className="form-group">
                  <label>Content *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    rows={10}
                    placeholder="Enter STRENNA content..."
                  />
                </div>

                <div className="form-group">
                  <label>Image</label>
                  <div className="image-upload-section">
                    <div className="image-upload-controls">
                      <div className="file-input-wrapper">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          disabled={uploading}
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
                        value={typeof formData.image === 'string' ? formData.image : ''}
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
                        <img src={getImageUrl(imagePreview)} alt="Preview" onError={(e) => {
                          console.error('Image failed to load:', imagePreview);
                          e.currentTarget.style.display = 'none';
                        }} />
                      </div>
                    )}
                  </div>
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
                  <button type="submit" className="btn-primary">
                    {strenna ? 'Update STRENNA' : 'Save STRENNA'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!showForm && strenna && (
          <div className="content-preview">
            <div className="preview-card">
              <h3>Current STRENNA {strenna.year}</h3>
              {strenna.image && (
                <div className="preview-image">
                  <img src={strenna.image} alt={strenna.title} />
                </div>
              )}
              <div className="preview-content">
                <h4>{strenna.title}</h4>
                <p>{strenna.content.substring(0, 200)}...</p>
                <p className="status-badge">
                  Status: {strenna.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        )}

        {!showForm && !strenna && (
          <div className="empty-state">
            <p>No STRENNA has been added yet. Click "Add STRENNA" to create one.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default StrennaManagement;

