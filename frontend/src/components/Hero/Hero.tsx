import { useEffect, useState, useCallback } from 'react';
import { apiGet } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { getImageUrl } from '../../utils/imageUtils';
import './Hero.css';

interface HeroBanner {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  image: string;
  link_url?: string;
  order_index?: number;
  is_active: boolean;
}

function Hero() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: HeroBanner[] }>(
        `${API_ENDPOINTS.BANNERS.LIST}?type=hero`
      );
      if (response.success && response.data && response.data.length > 0) {
        // Filter only active banners and sort by order_index
        const activeBanners = response.data
          .filter(banner => banner.is_active)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        setBanners(activeBanners);
      }
    } catch (error) {
      console.error('Failed to load hero banners:', error);
    }
  };

  // Auto-play functionality
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 2000); // Change slide every 2 seconds (transition speed: 20)

    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  }, [banners.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      (prevIndex + 1) % banners.length
    );
  }, [banners.length]);

  // Touch swipe navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }
  };

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <section 
      className="hero-slider"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div 
        className="hero-slide"
        onClick={() => {
          if (currentBanner.link_url) {
            window.open(currentBanner.link_url, '_blank', 'noopener,noreferrer');
          }
        }}
        style={{ cursor: currentBanner.link_url ? 'pointer' : 'default' }}
      >
        <div className="hero-container">
          {/* Full Width Image Background */}
          {currentBanner.image && (
            <div className="hero-image-full">
              <img 
                src={getImageUrl(currentBanner.image)} 
                alt={currentBanner.title}
                loading="eager"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.classList.add('no-image');
                  }
                }}
                onLoad={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'block';
                  target.style.visibility = 'visible';
                  target.style.opacity = '1';
                }}
              />
            </div>
          )}
          
          {/* Title Overlay */}
          <div className="hero-content-overlay">
            <h1 className="hero-title">{currentBanner.title}</h1>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button 
            className="hero-nav hero-nav-prev"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button 
            className="hero-nav hero-nav-next"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label="Next slide"
          >
            ›
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {banners.length > 1 && (
        <div className="hero-dots">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`hero-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {banners.length > 1 && (
        <div className="hero-counter">
          {currentIndex + 1} / {banners.length}
        </div>
      )}
    </section>
  );
}

export default Hero;
