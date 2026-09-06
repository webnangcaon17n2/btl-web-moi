import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiMail, FiFacebook, FiAward, FiInfo, FiCamera } from 'react-icons/fi';
import { API_BASE } from '../../config/api';
import './ExpertManager.css';

const ExpertManager = () => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    ho_ten: '',
    vai_tro: '',
    hinh_anh: '',
    mo_ta: '',
    kinh_nghiem: '',
    chuyen_mon: '',
    email: '',
    social_fb: '',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchExperts();
  }, []);

  const fetchExperts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/experts`);
      if (response.data.success) {
        setExperts(response.data.data);
      }
    } catch (error) {
      showNotification('error', 'Lỗi khi tải danh sách chuyên gia');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 3000);
  };

  const handleEdit = (expert) => {
    setEditingId(expert.id);
    setIsAdding(false);
    setFormData({
      ho_ten: expert.ho_ten || '',
      vai_tro: expert.vai_tro || '',
      hinh_anh: expert.hinh_anh || '',
      mo_ta: expert.mo_ta || '',
      kinh_nghiem: expert.kinh_nghiem || '',
      chuyen_mon: expert.chuyen_mon || '',
      email: expert.email || '',
      social_fb: expert.social_fb || '',
    });
  };

  const handleSave = async (id) => {
    if (!formData.ho_ten || !formData.vai_tro) {
      showNotification('error', 'Vui lòng điền đầy đủ Họ tên và Vai trò');
      return;
    }

    try {
      if (id === 'new') {
        const res = await axios.post(`${API_BASE}/experts`, formData);
        if (res.data.success) showNotification('success', 'Thêm chuyên gia thành công');
      } else {
        const res = await axios.put(`${API_BASE}/experts/${id}`, formData);
        if (res.data.success) showNotification('success', 'Cập nhật thông tin thành công');
      }
      setEditingId(null);
      setIsAdding(false);
      fetchExperts();
    } catch (error) {
      showNotification('error', 'Có lỗi xảy ra: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chuyên gia này?')) {
      try {
        await axios.delete(`${API_BASE}/experts/${id}`);
        showNotification('success', 'Đã xóa chuyên gia');
        fetchExperts();
      } catch (error) {
        showNotification('error', 'Không thể xóa: ' + error.message);
      }
    }
  };

  if (loading) return <div className="loading-state">Đang tải dữ liệu chuyên gia...</div>;

  return (
    <div className="expert-manager">
      <div className="manager-header">
        <div>
          <h1>Quản lý chuyên gia</h1>
          <p className="subtitle">Quản lý đội ngũ cố vấn và chuyên gia cây cảnh của Aether</p>
        </div>
        <button className="add-btn" onClick={() => { setIsAdding(true); setEditingId('new'); setFormData({ ho_ten: '', vai_tro: '', hinh_anh: '', mo_ta: '', kinh_nghiem: '', chuyen_mon: '', email: '', social_fb: '' }); }}>
          <FiPlus /> Thêm chuyên gia
        </button>
      </div>

      <AnimatePresence>
        {notification.message && (
          <motion.div 
            className={`notification-toast ${notification.type}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="expert-table-container">
        <table className="expert-table">
          <thead>
            <tr>
              <th>Chuyên gia</th>
              <th>Thông tin chi tiết</th>
              <th>Mô tả & Liên hệ</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr className="adding-row editing-mode">
                <td>
                  <div className="expert-avatar-edit">
                    <div className="avatar-preview">
                      {formData.hinh_anh ? <img src={formData.hinh_anh} alt="Preview" /> : <FiCamera />}
                    </div>
                    <input type="text" placeholder="URL Hình ảnh" value={formData.hinh_anh} onChange={(e) => setFormData({...formData, hinh_anh: e.target.value})} />
                  </div>
                  <div className="expert-basic-edit">
                    <input type="text" className="input-ho-ten" placeholder="Họ và tên" value={formData.ho_ten} onChange={(e) => setFormData({...formData, ho_ten: e.target.value})} />
                    <input type="text" className="input-vai-tro" placeholder="Vai trò (VD: Nghệ nhân)" value={formData.vai_tro} onChange={(e) => setFormData({...formData, vai_tro: e.target.value})} />
                  </div>
                </td>
                <td>
                  <div className="edit-grid">
                    <div className="input-with-icon">
                      <FiAward />
                      <input type="text" placeholder="Kinh nghiệm (VD: 10 Năm)" value={formData.kinh_nghiem} onChange={(e) => setFormData({...formData, kinh_nghiem: e.target.value})} />
                    </div>
                    <div className="input-with-icon">
                      <FiInfo />
                      <input type="text" placeholder="Chuyên môn" value={formData.chuyen_mon} onChange={(e) => setFormData({...formData, chuyen_mon: e.target.value})} />
                    </div>
                  </div>
                </td>
                <td>
                  <div className="edit-grid">
                    <div className="input-with-icon">
                      <FiMail />
                      <input type="text" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="input-with-icon">
                      <FiFacebook />
                      <input type="text" placeholder="Facebook URL" value={formData.social_fb} onChange={(e) => setFormData({...formData, social_fb: e.target.value})} />
                    </div>
                    <textarea placeholder="Mô tả tóm tắt về chuyên gia..." value={formData.mo_ta} onChange={(e) => setFormData({...formData, mo_ta: e.target.value})} />
                  </div>
                </td>
                <td className="actions">
                  <button className="save-btn" onClick={() => handleSave('new')} title="Lưu"><FiSave /></button>
                  <button className="cancel-btn" onClick={() => setIsAdding(false)} title="Hủy"><FiX /></button>
                </td>
              </tr>
            )}
            {experts.map((expert) => (
              <tr key={expert.id} className={editingId === expert.id ? 'editing-mode' : ''}>
                {editingId === expert.id ? (
                  <>
                    <td>
                      <div className="expert-avatar-edit">
                        <div className="avatar-preview">
                          <img src={formData.hinh_anh} alt="Preview" />
                        </div>
                        <input type="text" value={formData.hinh_anh} onChange={(e) => setFormData({...formData, hinh_anh: e.target.value})} />
                      </div>
                      <div className="expert-basic-edit">
                        <input type="text" className="input-ho-ten" value={formData.ho_ten} onChange={(e) => setFormData({...formData, ho_ten: e.target.value})} />
                        <input type="text" className="input-vai-tro" value={formData.vai_tro} onChange={(e) => setFormData({...formData, vai_tro: e.target.value})} />
                      </div>
                    </td>
                    <td>
                      <div className="edit-grid">
                        <div className="input-with-icon"><FiAward /><input type="text" value={formData.kinh_nghiem} onChange={(e) => setFormData({...formData, kinh_nghiem: e.target.value})} /></div>
                        <div className="input-with-icon"><FiInfo /><input type="text" value={formData.chuyen_mon} onChange={(e) => setFormData({...formData, chuyen_mon: e.target.value})} /></div>
                      </div>
                    </td>
                    <td>
                      <div className="edit-grid">
                        <div className="input-with-icon"><FiMail /><input type="text" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
                        <div className="input-with-icon"><FiFacebook /><input type="text" value={formData.social_fb} onChange={(e) => setFormData({...formData, social_fb: e.target.value})} /></div>
                        <textarea value={formData.mo_ta} onChange={(e) => setFormData({...formData, mo_ta: e.target.value})} />
                      </div>
                    </td>
                    <td className="actions">
                      <button className="save-btn" onClick={() => handleSave(expert.id)}><FiSave /></button>
                      <button className="cancel-btn" onClick={() => setEditingId(null)}><FiX /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>
                      <div className="expert-info-cell">
                        <img src={expert.hinh_anh} alt={expert.ho_ten} className="table-img" />
                        <div>
                          <div className="expert-name">{expert.ho_ten}</div>
                          <div className="expert-role-tag">{expert.vai_tro}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="expert-details-cell">
                        <p><FiAward /> <span>{expert.kinh_nghiem}</span></p>
                        <p><FiInfo /> <span>{expert.chuyen_mon}</span></p>
                      </div>
                    </td>
                    <td>
                      <div className="expert-desc-cell">
                        <p className="mo-ta-text">{expert.mo_ta?.substring(0, 80)}...</p>
                        <div className="expert-socials">
                          {expert.email && <FiMail title={expert.email} />}
                          {expert.social_fb && <FiFacebook title="Facebook Profile" />}
                        </div>
                      </div>
                    </td>
                    <td className="actions">
                      <button className="edit-btn" onClick={() => handleEdit(expert)} title="Chỉnh sửa"><FiEdit2 /></button>
                      <button className="delete-btn" onClick={() => handleDelete(expert.id)} title="Xóa"><FiTrash2 /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpertManager;

