import { useState, useEffect } from 'react'
import { FiStar } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { API_BASE } from '../../config/api'
import './Testimonials.css'

const COLORS = ['#a8e063', '#4facfe', '#f093fb', '#ff9a9e', '#fab1a0', '#00d2d3'];

const FALLBACK_TESTIMONIALS = [
  {
    ho_ten: 'Sarah Johnson',
    role: 'Interior Designer',
    tin_nhan: 'Aether has completely transformed my approach to interior design. The quality of their plants is exceptional.',
    so_sao: 5,
  },
  {
    ho_ten: 'Michael Chen',
    role: 'Plant Enthusiast',
    tin_nhan: "I've ordered from many plant shops, but Aether stands out. Their packaging is sustainable and beautiful.",
    so_sao: 5,
  },
  {
    ho_ten: 'Emma Williams',
    role: 'Home Decorator',
    tin_nhan: 'The variety of plants available is amazing. I especially love their rare collection and top-notch service.',
    so_sao: 5,
  },
];

function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/contact/testimonials`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          // Kết hợp dữ liệu thực tế với fallback nếu không đủ 3 cái
          const realData = data.data;
          const merged = [...realData, ...FALLBACK_TESTIMONIALS].slice(0, 3);
          setTestimonials(merged);
        } else {
          setTestimonials(FALLBACK_TESTIMONIALS);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching testimonials:', err);
        setTestimonials(FALLBACK_TESTIMONIALS);
        setLoading(false);
      });
  }, []);

  const getInitials = (name) => {
    if (!name) return 'A';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <section className="testimonials section-padding" id="blog">
      <div className="container">
        <div className="testimonials__header">
          <span className="testimonials__tag">Testimonials</span>
          <h2 className="testimonials__title">What Our Customers Say</h2>
          <p className="testimonials__subtitle">
            Join thousands of happy plant parents who trust Aether
          </p>
        </div>

        {loading ? (
          <div className="testimonials__loading">Đang tải đánh giá...</div>
        ) : (
          <>
            <div className="testimonials__grid">
              {testimonials.map((t, index) => (
                <div
                  key={index}
                  className="testimonial-card"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="testimonial-card__stars">
                    {[...Array(t.so_sao || 5)].map((_, i) => (
                      <FiStar key={i} size={16} className="testimonial-card__star" />
                    ))}
                  </div>
                  <p className="testimonial-card__text">"{t.tin_nhan}"</p>
                  <div className="testimonial-card__author">
                    <div
                      className="testimonial-card__avatar"
                      style={{ 
                        background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}88)` 
                      }}
                    >
                      {getInitials(t.ho_ten)}
                    </div>
                    <div>
                      <div className="testimonial-card__name">{t.ho_ten}</div>
                      <div className="testimonial-card__role">{t.role || 'Khách hàng'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="testimonials__footer">
              <Link to="/all-reviews" className="view-all-btn">
                Xem tất cả đánh giá
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default Testimonials


