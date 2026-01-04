import { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { apiGet } from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import './NewsLine.css';

interface NewsLineIssue {
  id: number;
  title: string;
  month: number;
  year: number;
  cover_image: string;
  pdf_path: string;
  qr_code_url: string;
  description: string;
  created_at: string;
}

interface Archive {
  [year: string]: Array<{ month: number; count: number }>;
}

function NewsLine() {
  const [currentIssue, setCurrentIssue] = useState<NewsLineIssue | null>(null);
  const [issues, setIssues] = useState<NewsLineIssue[]>([]);
  const [archive, setArchive] = useState<Archive>({});
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentIssue();
    loadArchive();
  }, []);

  useEffect(() => {
    if (selectedYear || selectedMonth) {
      loadIssues();
    }
  }, [selectedYear, selectedMonth]);

  const loadCurrentIssue = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: NewsLineIssue | null }>(
        API_ENDPOINTS.NEWSLINE.CURRENT
      );
      if (response.success && response.data) {
        setCurrentIssue(response.data);
      }
    } catch (error) {
      console.error('Failed to load current issue:', error);
    }
  };

  const loadIssues = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.append('year', selectedYear.toString());
      if (selectedMonth) params.append('month', selectedMonth.toString());
      
      const response = await apiGet<{ success: boolean; data: NewsLineIssue[] }>(
        `${API_ENDPOINTS.NEWSLINE.LIST}?${params.toString()}`
      );
      if (response.success) {
        setIssues(response.data);
      }
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArchive = async () => {
    try {
      const response = await apiGet<{ success: boolean; archive: Archive }>(
        API_ENDPOINTS.NEWSLINE.ARCHIVE
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
    <div className="newsline-page">
      <Header />
      <div className="newsline-content-container">
        <h1>NewsLine</h1>

        {currentIssue && !selectedYear && (
          <div className="current-issue">
            <h2>Current Issue</h2>
            <div className="issue-card featured">
              {currentIssue.cover_image && (
                <div className="issue-cover">
                  <img src={currentIssue.cover_image} alt={currentIssue.title} />
                </div>
              )}
              <div className="issue-content">
                <h3>{currentIssue.title}</h3>
                <p className="issue-date">
                  {monthNames[currentIssue.month - 1]} {currentIssue.year}
                </p>
                {currentIssue.description && <p className="issue-desc">{currentIssue.description}</p>}
                {currentIssue.pdf_path && (
                  <a href={currentIssue.pdf_path} target="_blank" rel="noopener noreferrer" className="read-btn">
                    Read Online
                  </a>
                )}
                {currentIssue.qr_code_url && (
                  <div className="qr-code">
                    <p>Scan to read:</p>
                    <img src={currentIssue.qr_code_url} alt="QR Code" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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

        {(selectedYear || selectedMonth) && (
          <div className="issues-list">
            {loading ? (
              <p>Loading...</p>
            ) : issues.length === 0 ? (
              <p>No issues found.</p>
            ) : (
              issues.map((issue) => (
                <div key={issue.id} className="issue-card">
                  {issue.cover_image && (
                    <div className="issue-cover">
                      <img src={issue.cover_image} alt={issue.title} />
                    </div>
                  )}
                  <div className="issue-content">
                    <h3>{issue.title}</h3>
                    <p className="issue-date">
                      {monthNames[issue.month - 1]} {issue.year}
                    </p>
                    {issue.description && <p className="issue-desc">{issue.description}</p>}
                    {issue.pdf_path && (
                      <a href={issue.pdf_path} target="_blank" rel="noopener noreferrer" className="read-btn">
                        Read Online
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default NewsLine;

