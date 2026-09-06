import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
import { PiPlantFill, PiTreeFill, PiCactusFill, PiDropFill, PiPottedPlantFill, PiLeafFill } from 'react-icons/pi'
import { API_BASE } from '../../config/api'
import './Categories.css'

const categories = [
  {
    id: 1,
    name: 'Indoor Plants',
    dbValue: 'Cây Trong Nhà',
    icon: <PiPlantFill size={28} />,
    color: '#e8f5e9',
  },
  {
    id: 2,
    name: 'Outdoor Plants',
    dbValue: 'Cây Ngoài Trời',
    icon: <PiTreeFill size={28} />,
    color: '#e3f2fd',
  },
  {
    id: 3,
    name: 'Succulents',
    dbValue: 'Sen Đá & Xương Rồng',
    icon: <PiCactusFill size={28} />,
    color: '#fff3e0',
  },
  {
    id: 4,
    name: 'Plant Care',
    dbValue: 'Chăm Sóc Cây',
    icon: <PiDropFill size={28} />,
    color: '#fce4ec',
  },
  {
    id: 5,
    name: 'Pots & Planters',
    dbValue: 'Chậu & Bình Hoa',
    icon: <PiPottedPlantFill size={28} />,
    color: '#f3e5f5',
  },
  {
    id: 6,
    name: 'Seeds & Bulbs',
    dbValue: 'Hạt Giống & Củ',
    icon: <PiLeafFill size={28} />,
    color: '#e0f7fa',
  },
]

function Categories() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetch(`${API_BASE}/san-pham`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data)
        } else {
          setProducts([])
        }
      })
      .catch(err => {
        console.error('Lỗi khi lấy dữ liệu danh mục:', err)
        setProducts([])
      })
  }, [])

  const categoryCounts = useMemo(() => {
    const counts = {}
    if (Array.isArray(products)) {
      products.forEach(p => {
        const cat = p.category || p.ten_danh_muc
        if (cat) {
          const catName = cat.trim()
          counts[catName] = (counts[catName] || 0) + 1
        }
      })
    }
    return counts
  }, [products])

  return (
    <section className="categories section-padding" id="products">
      <div className="container">
        <div className="categories__header">
          <span className="categories__tag">Browse</span>
          <h2 className="categories__title">Shop by Category</h2>
          <p className="categories__subtitle">
            Find the perfect plant for every space and lifestyle
          </p>
        </div>

        <div className="categories__grid">
          {categories.map((cat, index) => (
            <Link
              to="/products"
              state={{ category: cat.dbValue }}
              key={cat.id}
              className="category-card"
              style={{
                '--card-color': cat.color,
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div className="category-card__icon">{cat.icon}</div>
              <div className="category-card__info">
                <h3 className="category-card__name">{cat.name}</h3>
                <span className="category-card__count">
                  {categoryCounts[cat.dbValue] || 0} Products
                </span>
              </div>
              <div className="category-card__arrow">
                <FiArrowRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Categories
