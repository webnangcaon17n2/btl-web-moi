import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiTrendingUp } from 'react-icons/fi';
import { API_BASE } from '../../config/api';
import './GoogleSearchBar.css';

// Hàm loại bỏ dấu tiếng Việt phục vụ so khớp không dấu ở client
const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

const GoogleSearchBar = ({ placeholder = 'Search products...', initialValue = '', onSearchSelect }) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync query when initialValue changes
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Fetch Gợi ý phổ biến (Trending) khi khởi tạo
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API_BASE}/san-pham/search`);
        if (res.ok) {
          const data = await res.json();
          // Lấy top 5 sản phẩm nổi bật
          if (Array.isArray(data)) {
            setTrending(data.slice(0, 5));
          }
        }
      } catch (err) {
        console.error('Lỗi tải trending:', err);
      }
    };
    fetchTrending();
  }, []);

  // Gọi API tìm kiếm mỗi khi query thay đổi (Có Debounce 300ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/san-pham/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Lỗi gọi API search:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Đóng dropdown khi click ra ngoài (Click Outside)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Xử lý khi chọn một item kết quả
  const handleSelect = (item) => {
    setQuery(item.ten_san_pham);
    setIsFocused(false);
    setSelectedIndex(-1);
    if (onSearchSelect) {
      onSearchSelect(item.ten_san_pham);
    }
  };

  // Xử lý khi nhấn nút Clear (X)
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedIndex(-1);
    if (onSearchSelect) {
      onSearchSelect('');
    }
  };

  // Xử lý điều hướng bàn phím (Keyboard Navigation)
  const handleKeyDown = (e) => {
    const listLength = query.trim() ? suggestions.length : trending.length;
    
    if (listLength === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 >= listLength ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 < 0 ? listLength - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < listLength) {
        const selectedItem = query.trim() ? suggestions[selectedIndex] : trending[selectedIndex];
        handleSelect(selectedItem);
      } else {
        // Nếu không highlight cụ thể, tìm theo query hiện tại
        setIsFocused(false);
        if (onSearchSelect) {
          onSearchSelect(query);
        }
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setSelectedIndex(-1);
    }
  };

  // Helper làm nổi bật (highlight) từ khóa trùng khớp (kể cả không dấu)
  const renderHighlightedName = (fullName, searchQuery) => {
    if (!searchQuery.trim()) return fullName;

    const cleanName = removeVietnameseTones(fullName);
    const cleanQuery = removeVietnameseTones(searchQuery);
    
    // Tìm khớp không dấu
    const index = cleanName.indexOf(cleanQuery);
    if (index !== -1) {
      const start = index;
      const end = index + cleanQuery.length;
      
      const before = fullName.substring(0, start);
      const match = fullName.substring(start, end);
      const after = fullName.substring(end);
      
      return (
        <>
          {before}
          <span className="google-search-highlight">{match}</span>
          {after}
        </>
      );
    }

    return fullName;
  };

  const showDropdown = isFocused && (query.trim() || trending.length > 0);

  return (
    <div 
      className={`google-search-container ${showDropdown ? 'is-focused' : ''}`} 
      ref={containerRef}
    >
      {/* Search Input Bar */}
      <div className="google-search-bar">
        <div className="google-search-icon-left">
          <FiSearch size={18} />
        </div>
        
        <input
          type="text"
          className="google-search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
        />

        {loading && <div className="google-search-spinner" />}

        {query && (
          <button 
            type="button" 
            className="google-search-clear-btn" 
            onClick={handleClear}
            aria-label="Clear search"
          >
            <FiX size={16} />
          </button>
        )}
      </div>

      {/* Floating Suggestions Dropdown */}
      {showDropdown && (
        <div className="google-search-dropdown">
          {query.trim() ? (
            /* Có từ khoá gõ -> Hiện gợi ý gợi nhớ */
            suggestions.length > 0 ? (
              <div className="google-dropdown-section">
                <div className="google-dropdown-section-title">Kết quả phù hợp</div>
                <ul className="google-search-results-list">
                  {suggestions.map((item, index) => (
                    <li
                      key={item.id}
                      className={`google-search-item ${selectedIndex === index ? 'is-selected' : ''}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <img 
                        src={item.anh_bia || `https://placehold.co/100x100/e8f5e9/4caf50?text=${encodeURIComponent(item.ten_san_pham)}`} 
                        alt={item.ten_san_pham} 
                        className="google-search-item-image"
                      />
                      <div className="google-search-item-info">
                        <div className="google-search-item-path">{item.categoryPath}</div>
                        <div className="google-search-item-name">
                          {renderHighlightedName(item.ten_san_pham, query)}
                        </div>
                      </div>
                      <div className="google-search-item-price-col">
                        <span className="google-search-item-price">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.gia_ban)}
                        </span>
                        {item.gia_cu && (
                          <span className="google-search-item-old-price">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.gia_cu)}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              !loading && (
                <div className="google-search-no-results">
                  Không tìm thấy sản phẩm nào phù hợp với "<strong>{query}</strong>"
                </div>
              )
            )
          ) : (
            /* Không có từ khóa gõ -> Hiện gợi ý hot / xu hướng */
            trending.length > 0 && (
              <div className="google-dropdown-section">
                <div className="google-dropdown-section-title">Gợi ý phổ biến</div>
                <ul className="google-search-results-list">
                  {trending.map((item, index) => (
                    <li
                      key={item.id}
                      className={`google-search-trending-item ${selectedIndex === index ? 'is-selected' : ''}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <span className="google-search-trending-icon">
                        <FiTrendingUp size={16} />
                      </span>
                      <span>{item.ten_san_pham}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default GoogleSearchBar;
