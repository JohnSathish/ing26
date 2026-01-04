import { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './Gallery.css';

interface GalleryItem {
  id: number;
  title: string;
  type: 'photo' | 'video';
  file_path: string;
  thumbnail: string;
  description: string;
  category: string;
  is_featured: boolean;
}

interface Category {
  category: string;
  count: number;
}

function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedType, setSelectedType] = useState<'photo' | 'video' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGallery();
    loadCategories();
  }, [selectedType, selectedCategory]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedType) params.append('type', selectedType);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await apiGet<{ success: boolean; data: GalleryItem[] }>(
        `${API_ENDPOINTS.GALLERY.LIST}?${params.toString()}`
      );
      if (response.success) {
        setItems(response.data);
      }
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Category[] }>(
        API_ENDPOINTS.GALLERY.CATEGORIES
      );
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  return (
    <div className="gallery-page">
      <Header />
      <div className="gallery-content-container">
        <h1>Gallery</h1>

        <div className="gallery-filters">
          <div className="filter-group">
            <label>Type:</label>
            <button
              className={`filter-btn ${selectedType === null ? 'active' : ''}`}
              onClick={() => setSelectedType(null)}
            >
              All
            </button>
            <button
              className={`filter-btn ${selectedType === 'photo' ? 'active' : ''}`}
              onClick={() => setSelectedType('photo')}
            >
              Photos
            </button>
            <button
              className={`filter-btn ${selectedType === 'video' ? 'active' : ''}`}
              onClick={() => setSelectedType('video')}
            >
              Videos
            </button>
          </div>

          {categories.length > 0 && (
            <div className="filter-group">
              <label>Category:</label>
              <button
                className={`filter-btn ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  className={`filter-btn ${selectedCategory === cat.category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === cat.category ? null : cat.category)}
                >
                  {cat.category} ({cat.count})
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p>No items found.</p>
        ) : (
          <div className="gallery-grid">
            {items.map((item) => (
              <div key={item.id} className={`gallery-item ${item.is_featured ? 'featured' : ''}`}>
                {item.type === 'photo' ? (
                  <img
                    src={item.thumbnail || item.file_path}
                    alt={item.title}
                    className="gallery-image"
                  />
                ) : (
                  <div className="gallery-video">
                    <video
                      src={item.file_path}
                      poster={item.thumbnail}
                      controls
                      className="gallery-video-player"
                    />
                  </div>
                )}
                <div className="gallery-overlay">
                  <h3>{item.title}</h3>
                  {item.description && <p>{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Gallery;

