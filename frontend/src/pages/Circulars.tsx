import { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './Circulars.css';

interface Circular {
  id: number;
  title: string;
  month: number;
  year: number;
  file_path: string;
  description: string;
  created_at: string;
}

interface Archive {
  [year: string]: Array<{ month: number; count: number }>;
}

function Circulars() {
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [archive, setArchive] = useState<Archive>({});
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCirculars();
    loadArchive();
  }, [selectedYear, selectedMonth]);

  const loadCirculars = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.append('year', selectedYear.toString());
      if (selectedMonth) params.append('month', selectedMonth.toString());
      
      const response = await apiGet<{ success: boolean; data: Circular[]; archive: Archive }>(
        `${API_ENDPOINTS.CIRCULARS.LIST}?${params.toString()}`
      );
      if (response.success) {
        setCirculars(response.data);
      }
    } catch (error) {
      console.error('Failed to load circulars:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArchive = async () => {
    try {
      const response = await apiGet<{ success: boolean; archive: Archive }>(
        API_ENDPOINTS.CIRCULARS.ARCHIVE
      );
      if (response.success && response.archive) {
        setArchive(response.archive);
      }
    } catch (error) {
      console.error('Failed to load archive:', error);
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="circulars-page">
      <Header />
      <div className="circulars-content-container">
        <h1>Circulars</h1>

        <div className="archive-nav">
          <h2>Archive</h2>
          <div className="archive-years">
            {Object.keys(archive).sort((a, b) => parseInt(b) - parseInt(a)).map((year) => (
              <div key={year} className="archive-year">
                <button
                  className={`year-btn ${selectedYear === parseInt(year) ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedYear(selectedYear === parseInt(year) ? null : parseInt(year));
                    setSelectedMonth(null);
                  }}
                >
                  {year}
                </button>
                {selectedYear === parseInt(year) && (
                  <div className="archive-months">
                    {archive[year].map((item) => (
                      <button
                        key={item.month}
                        className={`month-btn ${selectedMonth === item.month ? 'active' : ''}`}
                        onClick={() => setSelectedMonth(selectedMonth === item.month ? null : item.month)}
                      >
                        {monthNames[item.month - 1]} ({item.count})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="circulars-list">
          {loading ? (
            <p>Loading...</p>
          ) : circulars.length === 0 ? (
            <p>No circulars found.</p>
          ) : (
            circulars.map((circular) => (
              <div key={circular.id} className="circular-card">
                <h3>{circular.title}</h3>
                <p className="circular-date">
                  {monthNames[circular.month - 1]} {circular.year}
                </p>
                {circular.description && <p className="circular-desc">{circular.description}</p>}
                {circular.file_path && (
                  <a href={circular.file_path} target="_blank" rel="noopener noreferrer" className="download-btn">
                    Download PDF
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Circulars;

