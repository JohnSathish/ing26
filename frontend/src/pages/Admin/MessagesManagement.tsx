import { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { apiGet, apiPost, apiPut, apiUploadImage } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './Management.css';

interface Message {
  id: number;
  title: string;
  content: string;
  author_name: string;
  author_title: string;
  author_image: string;
  is_active: boolean;
}

function MessagesManagement() {
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author_image: '',
    is_active: true,
  });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessage();
  }, []);

  const loadMessage = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Message | null }>(
        API_ENDPOINTS.MESSAGES.LIST
      );
      if (response.success && response.data) {
        setMessage(response.data);
        setFormData({
          title: response.data.title,
          content: response.data.content,
          author_image: response.data.author_image || '',
          is_active: response.data.is_active,
        });
        setImagePreview(response.data.author_image || '');
      }
    } catch (error) {
      console.error('Failed to load message:', error);
    } finally {
      setLoading(false);
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
      setFormData({ ...formData, author_image: result.url });
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
    setFormData({ ...formData, author_image: '' });
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Auto-populate author_name and author_title from title or use defaults
      const submitData = {
        ...formData,
        author_name: formData.title.split(',')[0] || 'Provincial',
        author_title: formData.title.includes('Provincial') ? 'Provincial' : (formData.title.split(',')[1]?.trim() || ''),
      };
      
      if (message) {
        await apiPut(`${API_ENDPOINTS.MESSAGES.UPDATE}?id=${message.id}`, {
          ...submitData,
          id: message.id,
        });
      } else {
        await apiPost(API_ENDPOINTS.MESSAGES.CREATE, submitData);
      }
      setShowForm(false);
      showSuccess(message ? 'Message updated successfully!' : 'Message created successfully!');
      loadMessage();
    } catch (error: any) {
      showError(error.message || 'Operation failed');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner message="Loading message..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="management">
        <div className="management-header">
          <h1>Provincial Message Management</h1>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            {message ? 'Edit' : 'Create'} Message
          </button>
        </div>

        {showForm && (
          <div className="form-modal">
            <div className="form-content">
              <h2>{message ? 'Edit' : 'Create'} Provincial Message</h2>
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
                  <label>Content *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Provincial Image</label>
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
                        value={formData.author_image}
                        onChange={(e) => {
                          setFormData({ ...formData, author_image: e.target.value });
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://example.com/image.jpg or /uploads/images/image.jpg"
                      />
                    </div>
                    
                    {/* Image Preview */}
                    {(imagePreview || formData.author_image) && (
                      <div className="image-preview">
                        <img 
                          src={imagePreview || formData.author_image} 
                          alt="Provincial Preview" 
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
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {message && (
          <div className="message-preview">
            <h2>Current Message</h2>
            <p><strong>Title:</strong> {message.title}</p>
            <p><strong>Status:</strong> {message.is_active ? 'Active' : 'Inactive'}</p>
            {message.author_image && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Provincial Image:</strong>
                <img 
                  src={message.author_image} 
                  alt="Provincial" 
                  style={{ maxWidth: '200px', marginTop: '0.5rem', borderRadius: '0.5rem' }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default MessagesManagement;


