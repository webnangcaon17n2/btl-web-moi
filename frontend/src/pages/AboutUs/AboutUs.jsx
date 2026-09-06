import React, { useState, useEffect } from 'react';
import './AboutUs.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail } from 'react-icons/fi';
import { API_BASE } from '../../config/api';

const AboutUs = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpert, setSelectedExpert] = useState(null);

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const response = await fetch(`${API_BASE}/experts`);
        const data = await response.json();
        if (data.success) {
          setTeamMembers(data.data);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu chuyên gia:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExperts();
  }, []);

  return (
    <motion.div 
      className="about-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero__bg-blob"></div>
        <div className="container about-hero__content">
          <h1 className="about-hero__title">Bring nature into <br /> your living space</h1>
          <p className="about-hero__subtitle">
            Chúng tôi tin rằng mỗi cái cây đều mang trong mình một câu chuyện và sức mạnh chữa lành kỳ diệu giữa lòng thành phố.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-mission section-padding">
        <div className="container">
          <div className="about-mission__wrapper">
            <div className="about-mission__image">
              <img src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800" alt="Our Garden" />
              <div className="about-mission__experience">
                <span>10+</span>
                <p>Năm kinh nghiệm</p>
              </div>
            </div>
            <div className="about-mission__text">
              <h2>Lan tỏa hơi thở xanh cho mọi ngôi nhà</h2>
              <p>
                Aether Plant Shop ra đời với mong muốn kết nối con người với thiên nhiên giữa lòng thành phố ồn ào. 
                Chúng tôi không chỉ cung cấp những chậu cây xanh mướt, mà còn mang đến những giải pháp trang trí không gian 
                sống bền vững và tinh tế.
              </p>
              <div className="about-mission__stats">
                <div className="stat-item">
                  <h3>5k+</h3>
                  <p>Khách hàng hài lòng</p>
                </div>
                <div className="stat-item">
                  <h3>100+</h3>
                  <p>Loại cây đa dạng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="about-team section-padding">
        <div className="container">
          <div className="section-header center">
            <h2>Những người thắp xanh tâm hồn</h2>
            <p>Đội ngũ của chúng tôi gồm những nghệ nhân và chuyên gia về thực vật học luôn tận tâm vì không gian của bạn.</p>
          </div>
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <motion.div 
                key={index} 
                className="team-card"
                whileHover={{ y: -15 }}
                onClick={() => setSelectedExpert(member)}
              >
                <div className="team-image">
                  <img src={member.hinh_anh} alt={member.ho_ten} />
                  <div className="team-card__overlay">
                    <span>Xem chi tiết</span>
                  </div>
                </div>
                <div className="team-info">
                  <h3>{member.ho_ten}</h3>
                  <p>{member.vai_tro}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Expert Detail Modal */}
      <AnimatePresence>
        {selectedExpert && (
          <div className="expert-modal-overlay" onClick={() => setSelectedExpert(null)}>
            <motion.div 
              className="expert-modal" 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setSelectedExpert(null)}>&times;</button>
              <div className="modal-content">
                <div className="modal-image">
                  <img src={selectedExpert.hinh_anh} alt={selectedExpert.ho_ten} />
                </div>
                <div className="modal-text">
                  <span className="modal-tag">Expert Profile</span>
                  <h2>{selectedExpert.ho_ten}</h2>
                  <h4 className="modal-role">{selectedExpert.vai_tro}</h4>
                  
                  <div className="modal-info-grid">
                    <div className="info-item">
                      <span className="info-label">Kinh nghiệm</span>
                      <span className="info-value">{selectedExpert.kinh_nghiem || "10+ Năm"}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Chuyên môn</span>
                      <span className="info-value">{selectedExpert.chuyen_mon || "Thực vật học"}</span>
                    </div>
                  </div>

                  <div className="modal-divider"></div>
                  
                  <p className="modal-description">
                    {selectedExpert.mo_ta || "Chuyên gia dày dặn kinh nghiệm, luôn tận tâm mang đến những giải pháp xanh bền vững cho không gian sống của bạn."}
                  </p>

                  <div className="modal-contact-info">
                    {selectedExpert.email && (
                      <div className="contact-item">
                        <FiMail /> <span>{selectedExpert.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="modal-socials">
                    {selectedExpert.social_fb && (
                      <a href={selectedExpert.social_fb} target="_blank" rel="noreferrer" className="social-link fb">Facebook</a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AboutUs;
