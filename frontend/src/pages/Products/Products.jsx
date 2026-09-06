import { useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { FiChevronLeft, FiChevronRight, FiSearch, FiStar, FiPlus } from 'react-icons/fi'
import { useCart } from '../../context/CartContext'
import GoogleSearchBar from '../../components/GoogleSearchBar/GoogleSearchBar'
import './Products.css'
import '../../components/FeaturedProducts/FeaturedProducts.css'
import InteractiveStarRating from '../../components/InteractiveStarRating/InteractiveStarRating'

import { API_BASE } from '../../config/api'

const BADGE_CLASS = {
  'Bán chạy': 'bestseller',
  'Phổ biến': 'popular',
  'Mới': 'new',
  'Giảm giá': 'sale',
}

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

const CATEGORY_DISPLAY_NAME = {
  'Cây Trong Nhà': 'Indoor Plants',
  'Cây Ngoài Trời': 'Outdoor Plants',
  'Sen Đá & Xương Rồng': 'Succulents',
  'Chăm Sóc Cây': 'Plant Care',
  'Chậu & Bình Hoa': 'Pots & Planters',
  'Hạt Giống & Củ': 'Seeds & Bulbs',
}

function Products() {
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { addToCart } = useCart()
  const [activeCategory, setActiveCategory] = useState(location.state?.category || 'All Products')
  const [sortOption, setSortOption] = useState('default')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 9

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`${API_BASE}/san-pham`),
          fetch(`${API_BASE}/danh-muc`)
        ])
        if (!prodRes.ok || !catRes.ok) throw new Error('API connection error')
        const [prodData, catData] = await Promise.all([prodRes.json(), catRes.json()])
        setProducts(Array.isArray(prodData) ? prodData : [])
        setCategories(Array.isArray(catData) ? catData : [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (location.state?.category) {
      setActiveCategory(location.state.category)
    } else {
      setActiveCategory('All Products')
    }
  }, [location.state?.category])

  const handleCategoryChange = (category) => {
    setActiveCategory(category)
    setCurrentPage(1)
  }

  // Filter & Sort
  const processedProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : []
    let filtered = list.filter(p => {
      const matchesCategory = activeCategory === 'All Products' || (p.category && p.category.trim() === activeCategory)
      const matchesSearch = p.ten_san_pham.toLowerCase().includes(searchQuery.toLowerCase())

      // Filter by Badge if certain sort options are selected
      const matchesNewest = sortOption === 'newest' ? p.nhan_san_pham === 'Mới' : true
      const matchesPopular = sortOption === 'popular' ? p.nhan_san_pham === 'Phổ biến' : true

      return matchesCategory && matchesSearch && matchesNewest && matchesPopular
    })

    switch (sortOption) {
      case 'price-asc':
        filtered.sort((a, b) => a.gia_ban - b.gia_ban)
        break
      case 'price-desc':
        filtered.sort((a, b) => b.gia_ban - a.gia_ban)
        break
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.ngay_tao ? new Date(a.ngay_tao) : 0
          const dateB = b.ngay_tao ? new Date(b.ngay_tao) : 0
          if (dateB !== dateA) return dateB - dateA
          return b.id - a.id
        })
        break
      case 'popular':
      default:
        filtered.sort((a, b) => {
          const ratingDiff = (b.diem_danh_gia_tb || 0) - (a.diem_danh_gia_tb || 0)
          if (ratingDiff !== 0) return ratingDiff
          return (b.tong_luot_danh_gia || 0) - (a.tong_luot_danh_gia || 0)
        })
        break
    }
    return filtered
  }, [products, activeCategory, sortOption, searchQuery])

  const categoryCounts = useMemo(() => {
    const counts = { 'All Products': Array.isArray(products) ? products.length : 0 }
    if (Array.isArray(categories)) {
      categories.forEach(cat => {
        counts[cat.ten_danh_muc] = cat.so_luong_sp
      })
    }
    return counts
  }, [products, categories])

  const totalPages = Math.ceil(processedProducts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentProducts = processedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  return (
    <>
      <main className="products-page animate-fade-in">
        <div className="products-hero">
          <div className="container">
            <h1 className="products-hero__title animate-slide-up">Nature's Curated Collection</h1>
            <p className="products-hero__subtitle animate-slide-up-delay">Discover premium plants for every space and lifestyle</p>
          </div>
        </div>

        <div className="container products-layout">
          <aside className="products-sidebar">
            <div className="products-sidebar__search" style={{ border: 'none', padding: 0, background: 'transparent' }}>
              <GoogleSearchBar
                placeholder="Search products..."
                initialValue={searchQuery}
                onSearchSelect={(val) => {
                  setSearchQuery(val)
                  setCurrentPage(1)
                }}
              />
            </div>

            <button
              className={`products-sidebar__btn products-sidebar__btn--all ${activeCategory === 'All Products' ? 'products-sidebar__btn--active' : ''}`}
              onClick={() => handleCategoryChange('All Products')}
            >
              <span>All Products</span>
              <span className="products-sidebar__btn-count">{categoryCounts['All Products'] || 0}</span>
            </button>

            <div className="products-sidebar__group">
              <h4 className="products-sidebar__group-title">Categories</h4>
              <ul className="products-sidebar__list">
                {categories.map(cat => (
                  <li key={cat.id}>
                    <button
                      className={`products-sidebar__btn ${activeCategory === cat.ten_danh_muc ? 'products-sidebar__btn--active' : ''}`}
                      onClick={() => handleCategoryChange(cat.ten_danh_muc)}
                    >
                      <span>{CATEGORY_DISPLAY_NAME[cat.ten_danh_muc] || cat.ten_danh_muc}</span>
                      <span className="products-sidebar__btn-count">{cat.so_luong_sp || 0}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="products-main">
            <div className="products-main__header">
              <div className="products-main__header-title">
                <h2>{activeCategory === 'All Products' ? 'All Products' : (CATEGORY_DISPLAY_NAME[activeCategory] || activeCategory)}</h2>
              </div>

              <div className="products-sort-wrapper">
                <label htmlFor="sort">Sort by:</label>
                <select
                  id="sort"
                  className="products-sort-select"
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="default">Default Sorting</option>
                  <option value="popular">Popularity</option>
                  <option value="newest">New Arrivals</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#888', gridColumn: '1/-1' }}>
                <p style={{ fontSize: 18 }}>⏳ Loading products from database...</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#e53e3e' }}>
                <p>❌ Error: {error}</p>
                <p style={{ fontSize: 13, marginTop: 8 }}>Vui lòng kiểm tra kết nối máy chủ.</p>
              </div>
            ) : processedProducts.length > 0 ? (
              <>
                <div className="featured__grid products-grid-override">
                  {currentProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="product-card"
                      style={{ animationDelay: `${(index % 4) * 0.1}s` }}
                    >
                      <div className="product-card__image-wrapper">
                        {product.nhan_san_pham && (
                          <span className={`product-card__badge product-card__badge--${BADGE_CLASS[product.nhan_san_pham] || 'new'}`}>
                            {product.nhan_san_pham}
                          </span>
                        )}
                        <img
                          src={product.anh_bia || `https://placehold.co/300x300/e8f5e9/4caf50?text=${encodeURIComponent(product.ten_san_pham)}`}
                          alt={product.ten_san_pham}
                          className="product-card__image"
                        />
                        <button
                          className="product-card__quick-add"
                          aria-label={`Add ${product.ten_san_pham} to cart`}
                          onClick={() => addToCart(product)}
                        >
                          <FiPlus size={20} />
                        </button>
                      </div>
                      <div className="product-card__info">
                        <span className="product-card__category">{product.category}</span>
                        <h3 className="product-card__name">{product.ten_san_pham}</h3>
                        <InteractiveStarRating product={product} />
                        <div className="product-card__price-row">
                          <span className="product-card__price">{formatVND(product.gia_ban)}</span>
                          {product.gia_cu && (
                            <span className="product-card__old-price">{formatVND(product.gia_cu)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="products-pagination">
                    <button className="products-pagination__btn" onClick={handlePrevPage} disabled={currentPage === 1}>
                      <FiChevronLeft size={20} />
                    </button>
                    <div className="products-pagination__info">
                      Page <strong>{currentPage}</strong> / {totalPages}
                    </div>
                    <button className="products-pagination__btn" onClick={handleNextPage} disabled={currentPage === totalPages}>
                      <FiChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="products-empty">
                <p>No products found in this section.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

export default Products
