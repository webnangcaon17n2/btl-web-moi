import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowUpRight, FiPlay, FiPlus, FiStar } from 'react-icons/fi'
import { useCart } from '../../context/CartContext'
import { API_BASE } from '../../config/api'
import heroPlant from '../../assets/images/hero_plantt.png'
import chineseMoney from '../../assets/images/chinese_money_plant.png'
import hyperfresh from '../../assets/images/hyperfresh_plant.png'
import './Hero.css'

function Hero() {
  const [featuredCards, setFeaturedCards] = useState([
    {
      id: 1,
      name: 'Chinese Money plant',
      rating: '4.9/5',
      price: '$35',
      image: chineseMoney,
    },
    {
      id: 2,
      name: 'HyperFresh plant',
      rating: '4.9/5',
      price: '$45',
      image: hyperfresh,
    },
  ])
  const { addToCart } = useCart()

  useEffect(() => {
    fetch(`${API_BASE}/san-pham/top-rated`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length >= 2) {
          const mapped = data.map((item, index) => ({
            ...item,
            id: item.id,
            name: item.ten_san_pham,
            rating: (item.diem_danh_gia_tb || 5).toFixed(1) + '/5',
            price: item.gia_ban.toLocaleString('vi-VN') + 'đ',
            image: item.anh_bia || (index === 0 ? chineseMoney : hyperfresh)
          }))
          setFeaturedCards(mapped)
        }
      })
      .catch((err) => console.error('Lỗi lấy sản phẩm nổi bật:', err))
  }, [])

  return (
    <section className="hero" id="hero">
      {/* Background decoration */}
      <div className="hero__bg-gradient"></div>

      <div className="hero__content container">
        {/* Main heading */}
        <div className="hero__text">
          <h1 className="hero__title">
            Bring Nature Into Your Space – For Peace, Balance, and Growth.
          </h1>
        </div>

        {/* Explore button */}
        <Link to="/products" className="hero__cta-btn" id="explore-btn">
          Explore Plant <FiArrowUpRight size={18} />
        </Link>

        {/* Hero Center Image - background approach */}
        <div
          className="hero__image-wrapper"
          style={{ backgroundImage: `url(${heroPlant})` }}
          role="img"
          aria-label="Beautiful bonsai plant in a glass terrarium"
        ></div>

        {/* Watch Demo Card - Bottom Left */}
        <div className="hero__demo-card">
          <div className="hero__demo-avatar">
            <FiPlay size={20} />
          </div>
          <span className="hero__demo-text">Watch Demo</span>
        </div>

        {/* Featured Product Cards - Right */}
        <div className="hero__featured-cards">
          {featuredCards.map((card) => (
            <div key={card.id} className="hero__product-card">
              <img
                src={card.image}
                alt={card.name}
                className="hero__product-img"
              />
              <div className="hero__product-info">
                <h3 className="hero__product-name">{card.name}</h3>
                <div className="hero__product-rating">
                  <span>{card.rating}</span>
                  <FiStar size={12} className="hero__star" />
                </div>
                <span className="hero__product-price">{card.price}</span>
              </div>
              <button 
                className="hero__product-add" 
                aria-label={`Add ${card.name} to cart`}
                onClick={() => addToCart(card)}
              >
                <FiPlus size={18} />
              </button>
            </div>
          ))}
          <Link to="/shop" className="hero__view-all">View All</Link>
        </div>

        {/* Bottom CTA Section */}
        <div className="hero__bottom">
          {/* Stats */}
          <div className="hero__stats">
            <div className="hero__stat-number">25k+</div>
            <div className="hero__stat-label">Review</div>
            <div className="hero__stat-avatars">
              <div className="hero__avatar hero__avatar--1"></div>
              <div className="hero__avatar hero__avatar--2"></div>
              <div className="hero__avatar hero__avatar--3"></div>
            </div>
          </div>

          {/* Main CTA */}
          <div className="hero__bottom-main">
            <h2 className="hero__bottom-title">Transform Your Space with Greenery</h2>
            <p className="hero__bottom-subtitle">Last month, over 50,000 plants were sold</p>
            <Link to="/shop" className="hero__shop-btn" id="shop-now-btn">Shop Now</Link>
          </div>

          {/* Newsletter */}
          <div className="hero__bottom-newsletter">
            <p>Sign up to receive plant care tips, mindfulness guides, and special offers on our latest garden products.</p>
            <a href="#newsletter" className="hero__learn-more">Learn More</a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
