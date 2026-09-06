import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiStar, FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { API_BASE } from '../../config/api';
import './AllReviews.css';

const COLORS = ['#a8e063', '#4facfe', '#f093fb', '#ff9a9e', '#fab1a0', '#00d2d3'];

const AllReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${API_BASE}/contact/all-testimonials`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReviews(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching all reviews:', err);
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

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  return (
    <div className="all-reviews-page">
      <section className="reviews-hero">
        <div className="container">
          <Link to="/" className="back-link">
            <FiArrowLeft /> Quay về trang chủ
          </Link>
          <h1 className="reviews-hero__title">Đánh giá từ khách hàng</h1>
          <p className="reviews-hero__subtitle">
            Khám phá những trải nghiệm thực tế từ cộng đồng yêu cây tại Aether
          </p>
        </div>
      </section>

      <section className="reviews-content">
        <div className="container">
          {loading ? (
            <div className="reviews-loading">Đang tải tất cả đánh giá...</div>
          ) : reviews.length === 0 ? (
            <div className="no-reviews">Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ trải nghiệm!</div>
          ) : (
            <div className="reviews-grid">
              {reviews.map((review, index) => (
                <motion.div
                  key={index}
                  className="review-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="review-card__header">
                    <div className="review-card__stars">
                      {[...Array(review.so_sao || 5)].map((_, i) => (
                        <FiStar key={i} size={16} className="review-card__star" />
                      ))}
                    </div>
                    <span className="review-card__date">{formatDate(review.ngay_gui)}</span>
                  </div>
                  
                  <p className="review-card__text">"{review.tin_nhan}"</p>
                  
                  <div className="review-card__author">
                    <div
                      className="review-card__avatar"
                      style={{ 
                        background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}88)` 
                      }}
                    >
                      {getInitials(review.ho_ten)}
                    </div>
                    <div>
                      <div className="review-card__name">{review.ho_ten}</div>
                      <div className="review-card__role">Khách hàng thân thiết</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AllReviews;
