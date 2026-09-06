import { useState, useEffect } from 'react'
import { FiArrowRight, FiStar, FiPlus } from 'react-icons/fi'
import { useCart } from '../../context/CartContext'
import InteractiveStarRating from '../InteractiveStarRating/InteractiveStarRating'
import { API_URL } from '../../config/api'
import './FeaturedProducts.css'

const API = API_URL

const BADGE_CLASS = {
  'Bán chạy': 'bestseller',
  'Phổ biến': 'popular',
  'Mới': 'new',
  'Giảm giá': 'sale',
}

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

function FeaturedProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {
    fetch(`${API}/api/san-pham`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data.slice(0, 8) : [])) // Chỉ lấy 8 sản phẩm nổi bật
      .catch((err) => {
        console.error('Lỗi tải sản phẩm:', err)
        setProducts([])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="featured section-padding" id="shop">
      <div className="container">
        <div className="featured__header">
          <div>
            <span className="featured__tag">Our Collection</span>
            <h2 className="featured__title">Featured Plants</h2>
            <p className="featured__subtitle">
              Discover our handpicked selection of premium indoor plants
            </p>
          </div>
          <a href="/products" className="featured__see-all">
            See All <FiArrowRight size={16} />
          </a>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
            Đang tải sản phẩm...
          </div>
        ) : (
          <div className="featured__grid">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="product-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="product-card__image-wrapper">
                  {product.nhan_san_pham && (
                    <span
                      className={`product-card__badge product-card__badge--${BADGE_CLASS[product.nhan_san_pham] || 'new'}`}
                    >
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
                    aria-label={`Thêm ${product.ten_san_pham} vào giỏ`}
                    onClick={() => addToCart(product)}
                  >
                    <FiPlus size={20} />
                  </button>
                </div>
                <div className="product-card__info">
                  <span className="product-card__category">{product.category || product.ten_danh_muc}</span>
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
        )}
      </div>
    </section>
  )
}

export default FeaturedProducts
