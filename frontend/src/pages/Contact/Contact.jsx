import React, { useState } from 'react';
import './Contact.css';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FiMail, FiPhone, FiMapPin, FiSend, FiStar } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';

const Contact = () => {
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    ho_ten: '',
    email: '',
    tin_nhan: '',
    so_sao: 5
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Tự động điền thông tin nếu người dùng đã đăng nhập
  React.useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        ho_ten: currentUser.ho_ten || '',
        email: currentUser.email || ''
      }));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRatingChange = (rating) => {
    setFormData({ ...formData, so_sao: rating });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccess(true);
        setFormData({ 
          ho_ten: currentUser ? currentUser.ho_ten : '', 
          email: currentUser ? currentUser.email : '', 
          tin_nhan: '' 
        });
        // Tự động đóng thông báo sau 5 giây
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        setStatus({ type: 'error', message: data.message });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <motion.div 
      className="contact-page"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Hero Header */}
      <section className="contact-hero">
        <div className="container contact-hero__content">
          <h1 className="contact-hero__title">Liên hệ với chúng tôi</h1>
          <p className="contact-hero__subtitle">
            Chúng tôi luôn sẵn lòng lắng nghe ý kiến và giải đáp mọi thắc mắc của bạn về hành trình phủ xanh không gian sống.
          </p>
        </div>
      </section>

      <section className="contact-main">
        <div className="container">
          <div className="contact-wrapper">
            {/* Contact Info */}
            <motion.div 
              className="contact-info"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="info-items">
                <div className="info-item">
                  <div className="info-icon">
                    <FiMail />
                  </div>
                  <div className="info-text">
                    <h3>Email</h3>
                    <p>hello@aetherplant.vn</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <FiPhone />
                  </div>
                  <div className="info-text">
                    <h3>Điện thoại</h3>
                    <p>+84 123 456 789</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <FiMapPin />
                  </div>
                  <div className="info-text">
                    <h3>Địa chỉ</h3>
                    <p>235 Hoàng Quốc Việt, Bắc Từ Liêm, Hà Nội </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div 
              className="contact-form-card"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="form-header">
                <h2>Gửi tin nhắn</h2>
                <p>Chúng tôi luôn sẵn sàng lắng nghe ý kiến từ bạn.</p>
              </div>

              {status.message && (
                <div className={`status-message ${status.type}`}>
                  {status.message}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="ho_ten">Họ và tên</label>
                    <input 
                      type="text" 
                      id="ho_ten" 
                      placeholder="Nhập họ và tên" 
                      value={formData.ho_ten}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      placeholder="example@gmail.com" 
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group full">
                    <label htmlFor="tin_nhan">Tin nhắn</label>
                    <textarea 
                      id="tin_nhan" 
                      rows="5" 
                      placeholder="Bạn đang nghĩ gì?" 
                      value={formData.tin_nhan}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>

                  <div className="form-group full rating-group">
                    <label>Đánh giá trải nghiệm của bạn</label>
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar
                          key={star}
                          className={`star-icon ${formData.so_sao >= star ? 'active' : ''}`}
                          onClick={() => handleRatingChange(star)}
                        />
                      ))}
                      <span className="rating-text">({formData.so_sao}/5 sao)</span>
                    </div>
                  </div>
                </div>

                <button type="submit" className="contact-submit-btn" disabled={loading}>
                  {loading ? 'Đang gửi...' : (
                    <>
                      <FiSend /> Gửi tin nhắn
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </motion.div>

    {/* Success Overlay Modal */}
    <AnimatePresence>
      {showSuccess && (
        <motion.div 
          className="contact-success-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowSuccess(false)}
        >
          <motion.div 
            className="contact-success-card"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="success-icon-wrapper">
              <div className="success-check"></div>
            </div>
            <h2>Gửi thành công!</h2>
            <p>Cảm ơn bạn đã chia sẻ trải nghiệm với Aether.</p>
            <p className="sub-text">Chúng tôi đã ghi nhận ý kiến của bạn và sẽ phản hồi sớm nhất có thể.</p>
            <button className="close-success-btn" onClick={() => setShowSuccess(false)}>Tuyệt vời</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default Contact;
