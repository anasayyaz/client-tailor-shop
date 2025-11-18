import React from 'react';
import './Pagination.css';

function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems, onItemsPerPageChange }) {
  if (totalPages <= 1 && !onItemsPerPageChange) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pagination-container" dir="rtl">
      <div className="pagination-info">
        {onItemsPerPageChange && (
          <div className="pagination-items-per-page">
            <label>فی صفحہ:</label>
            <select 
              value={itemsPerPage} 
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="pagination-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
        <span className="pagination-text">
          {totalItems > 0 ? (
            <>دکھایا جا رہا ہے {startItem} سے {endItem} تک، کل {totalItems} میں سے</>
          ) : (
            <>کوئی آئٹم نہیں ملا</>
          )}
        </span>
      </div>
      
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            title="پہلا صفحہ"
          >
            ««
          </button>
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="پچھلا صفحہ"
          >
            ‹
          </button>
          
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="pagination-ellipsis">...</span>
              ) : (
                <button
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
          
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="اگلا صفحہ"
          >
            ›
          </button>
          <button
            className="pagination-btn"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="آخری صفحہ"
          >
            »»
          </button>
        </div>
      )}
    </div>
  );
}

export default Pagination;

