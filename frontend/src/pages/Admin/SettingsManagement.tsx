import { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { apiGet, apiPut, apiUploadImage } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import './Management.css';

function SettingsManagement() {
  const [settings, setSettings] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [provinceImagePreview, setProvinceImagePreview] = useState<string>('');
  const provinceImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: { [key: string]: string } }>(
        API_ENDPOINTS.SETTINGS.GET
      );
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    try {
      setSaving(true);
      await apiPut(`${API_ENDPOINTS.SETTINGS.UPDATE}?key=${key}`, { key, value, type: 'text' });
      setSettings({ ...settings, [key]: value });
      alert('Setting saved successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const handleProvinceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setProvinceImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploadingImage(true);
    try {
      const result = await apiUploadImage(file);
      await handleSave('province_image', result.url);
      setProvinceImagePreview(result.url);
      alert('Province image uploaded successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to upload image');
      setProvinceImagePreview('');
    } finally {
      setUploadingImage(false);
      if (provinceImageInputRef.current) {
        provinceImageInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (settings.province_image) {
      setProvinceImagePreview(settings.province_image);
    }
  }, [settings.province_image]);

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
          <h1>Settings Management</h1>
        </div>

        <div className="settings-list">
          <div className="setting-item">
            <label>Site Name</label>
            <input
              type="text"
              value={settings.site_name || ''}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
            />
            <button onClick={() => handleSave('site_name', settings.site_name || '')} className="btn-primary" disabled={saving}>
              Save
            </button>
          </div>

          <div className="setting-item">
            <label>Site Email</label>
            <input
              type="email"
              value={settings.site_email || ''}
              onChange={(e) => setSettings({ ...settings, site_email: e.target.value })}
            />
            <button onClick={() => handleSave('site_email', settings.site_email || '')} className="btn-primary" disabled={saving}>
              Save
            </button>
          </div>

          <div className="setting-item">
            <label>Site Phone</label>
            <input
              type="text"
              value={settings.site_phone || ''}
              onChange={(e) => setSettings({ ...settings, site_phone: e.target.value })}
            />
            <button onClick={() => handleSave('site_phone', settings.site_phone || '')} className="btn-primary" disabled={saving}>
              Save
            </button>
          </div>

          <div className="setting-item">
            <label>Facebook URL</label>
            <input
              type="url"
              value={settings.facebook_url || ''}
              onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
            />
            <button onClick={() => handleSave('facebook_url', settings.facebook_url || '')} className="btn-primary" disabled={saving}>
              Save
            </button>
          </div>

          <div className="setting-item">
            <label>Instagram URL</label>
            <input
              type="url"
              value={settings.instagram_url || ''}
              onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
            />
            <button onClick={() => handleSave('instagram_url', settings.instagram_url || '')} className="btn-primary" disabled={saving}>
              Save
            </button>
          </div>

          <div className="setting-item">
            <label>Twitter URL</label>
            <input
              type="url"
              value={settings.twitter_url || ''}
              onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })}
            />
            <button onClick={() => handleSave('twitter_url', settings.twitter_url || '')} className="btn-primary" disabled={saving}>
              Save
            </button>
          </div>

          <div className="setting-item">
            <label>YouTube URL</label>
            <input
              type="url"
              value={settings.youtube_url || ''}
              onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })}
            />
            <button onClick={() => handleSave('youtube_url', settings.youtube_url || '')} className="btn-primary" disabled={saving}>
              Save
            </button>
          </div>

          <div className="setting-item">
            <label>LinkedIn URL</label>
            <input
              type="url"
              value={settings.linkedin_url || ''}
              onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })}
            />
            <button onClick={() => handleSave('linkedin_url', settings.linkedin_url || '')} className="btn-primary" disabled={saving}>
              Save
            </button>
          </div>

          <div className="setting-item">
            <label>About Us - Vision</label>
            <textarea
              value={settings.about_us_vision || ''}
              onChange={(e) => setSettings({ ...settings, about_us_vision: e.target.value })}
              rows={6}
            />
            <button onClick={() => handleSave('about_us_vision', settings.about_us_vision || '')} className="btn-primary" disabled={saving}>
              Save
            </button>
          </div>

          <div className="setting-item">
            <label>About Us - Mission</label>
            <textarea
              value={settings.about_us_mission || ''}
              onChange={(e) => setSettings({ ...settings, about_us_mission: e.target.value })}
              rows={6}
            />
            <button onClick={() => handleSave('about_us_mission', settings.about_us_mission || '')} className="btn-primary" disabled={saving}>
              Save
            </button>
          </div>

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#1e40af', marginBottom: '1.5rem', fontWeight: 700 }}>Province Settings</h2>
          </div>

          <div className="setting-item">
            <label style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>Province Image *</label>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', fontStyle: 'italic' }}>
              Upload or enter the URL for the province image displayed in the Welcome section
            </p>
            <div className="image-upload-section">
              <div className="upload-option">
                <label className="upload-label">
                  <input
                    ref={provinceImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProvinceImageUpload}
                    disabled={uploadingImage}
                    style={{ display: 'none' }}
                  />
                  <span className="upload-button">
                    {uploadingImage ? 'Uploading...' : 'Choose Image File'}
                  </span>
                </label>
                <span className="upload-hint">Max 5MB (JPEG, PNG, GIF, WebP)</span>
              </div>
              
              <div className="upload-divider">
                <span>OR</span>
              </div>
              
              <div className="url-option">
                <label>Image URL</label>
                <input
                  type="text"
                  value={settings.province_image || ''}
                  onChange={(e) => {
                    setSettings({ ...settings, province_image: e.target.value });
                    setProvinceImagePreview(e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg or /uploads/images/image.jpg"
                />
                <button onClick={() => handleSave('province_image', settings.province_image || '')} className="btn-primary" disabled={saving} style={{ marginTop: '0.5rem' }}>
                  Save URL
                </button>
              </div>
              
              {(provinceImagePreview || settings.province_image) && (
                <div className="image-preview">
                  <img 
                    src={provinceImagePreview || settings.province_image} 
                    alt="Province Preview" 
                    onError={() => setProvinceImagePreview('')}
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      setSettings({ ...settings, province_image: '' });
                      setProvinceImagePreview('');
                      handleSave('province_image', '');
                    }}
                    className="remove-image-btn"
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="setting-item">
            <label style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>Province Message/Content</label>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', fontStyle: 'italic' }}>
              Enter the full province content/message. This will be displayed in the Welcome section with a Read More option. Leave empty to use default content.
            </p>
            <textarea
              value={settings.province_message || ''}
              onChange={(e) => setSettings({ ...settings, province_message: e.target.value })}
              rows={12}
              placeholder="Enter the full province content/message. This will be displayed in the Welcome section with a Read More option."
            />
            <button onClick={() => handleSave('province_message', settings.province_message || '')} className="btn-primary" disabled={saving}>
              Save
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default SettingsManagement;

