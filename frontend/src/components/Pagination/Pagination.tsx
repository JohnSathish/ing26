import { useState, useEffect } from 'react';
import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  showItemsPerPage?: boolean;
  showJumpToPage?: boolean;
  showInfo?: boolean;
  className?: string;
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100],
  showItemsPerPage = true,
  showJumpToPage = true,
  showInfo = true,
  className = ''
}: PaginationProps) {
  const [jumpToPage, setJumpToPage] = useState<string>('');

  // Reset jump input when page changes
  useEffect(() => {
    setJumpToPage('');
  }, [currentPage]);

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpToPage, 10);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpToPage('');
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage);
    }
    // Reset to page 1 when changing items per page
    onPageChange(1);
  };

  // Calculate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Maximum visible page numbers
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the start
      if (currentPage <= 3) {
        startPage = 2;
        endPage = 4;
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
        endPage = totalPages - 1;
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
      
      // Add page numbers around current page
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1 && !showItemsPerPage) {
    return null;
  }

  return (
    <div className={`pagination-enhanced ${className}`}>
      {showInfo && (
        <div className="pagination-info-section">
          <span className="pagination-info-text">
            Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> items
          </span>
        </div>
      )}

      <div className="pagination-controls-wrapper">
        {showItemsPerPage && onItemsPerPageChange && (
          <div className="pagination-items-per-page">
            <label htmlFor="items-per-page">Items per page:</label>
            <select
              id="items-per-page"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="pagination-select"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination-buttons">
            {/* First Page */}
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="pagination-btn pagination-btn-first"
              title="First page"
              aria-label="First page"
            >
              ««
            </button>

            {/* Previous Page */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn pagination-btn-prev"
              title="Previous page"
              aria-label="Previous page"
            >
              « Previous
            </button>

            {/* Page Numbers */}
            <div className="pagination-numbers">
              {pageNumbers.map((page, index) => {
                if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                  return (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                      ...
                    </span>
                  );
                }
                
                const pageNum = page as number;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`pagination-btn pagination-btn-number ${
                      currentPage === pageNum ? 'active' : ''
                    }`}
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn pagination-btn-next"
              title="Next page"
              aria-label="Next page"
            >
              Next »
            </button>

            {/* Last Page */}
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="pagination-btn pagination-btn-last"
              title="Last page"
              aria-label="Last page"
            >
              »»
            </button>
          </div>
        )}

        {showJumpToPage && totalPages > 1 && (
          <div className="pagination-jump">
            <form onSubmit={handleJumpToPage} className="pagination-jump-form">
              <label htmlFor="jump-to-page">Jump to:</label>
              <input
                id="jump-to-page"
                type="number"
                min="1"
                max={totalPages}
                value={jumpToPage}
                onChange={(e) => setJumpToPage(e.target.value)}
                placeholder={currentPage.toString()}
                className="pagination-jump-input"
                aria-label="Jump to page"
              />
              <button
                type="submit"
                className="pagination-btn pagination-btn-jump"
                disabled={!jumpToPage || parseInt(jumpToPage, 10) === currentPage}
                title="Go to page"
              >
                Go
              </button>
            </form>
          </div>
        )}
      </div>

      {showInfo && totalPages > 1 && (
        <div className="pagination-page-info">
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
        </div>
      )}
    </div>
  );
}

export default Pagination;

