import { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';
import './InteractiveStarRating.css';

function InteractiveStarRating({ product }) {
  const { currentUser } = useAuth();
  
  // Local state for immediate UI feedback
  const [hoverRating, setHoverRating] = useState(0);
  const [localRating, setLocalRating] = useState(product.diem_danh_gia_tb || 0);
  const [localTotal, setLocalTotal] = useState(product.tong_luot_danh_gia || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = async (ratingValue) => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập để đánh giá sản phẩm!');
      return;
    }
    
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/danh-gia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Backend hiện tại không bắt buộc JWT cho endpoint này nhưng ta vẫn nên tuân thủ UX
        },
        body: JSON.stringify({
          id_san_pham: product.id,
          id_nguoi_dung: currentUser.id,
          so_sao: ratingValue,
          noi_dung: '' // Đánh giá nhanh trên card không cần nội dung
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Cập nhật giao diện cục bộ (Tạm tính)
        // Công thức tính trung bình mới = (tổng cũ + điểm mới) / (số lượng cũ + 1)
        const newTotal = localTotal + 1;
        const newRating = ((localRating * localTotal) + ratingValue) / newTotal;
        
        setLocalRating(newRating);
        setLocalTotal(newTotal);
        
        alert('Cảm ơn bạn đã đánh giá!');
      } else {
        alert(data.error || data.message || 'Lỗi khi gửi đánh giá');
      }
    } catch (error) {
      console.error('Lỗi đánh giá:', error);
      alert('Đã có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Giá trị hiển thị: ưu tiên hoverRating nếu đang hover, ngược lại là localRating
  const displayRating = hoverRating > 0 ? hoverRating : localRating;

  return (
    <div className="interactive-rating">
      <div 
        className="interactive-rating__stars"
        onMouseLeave={() => setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            size={14}
            className={`interactive-rating__star ${star <= displayRating ? 'interactive-rating__star--filled' : ''}`}
            fill={star <= displayRating ? "#ffc107" : "none"}
            onMouseEnter={() => setHoverRating(star)}
            onClick={() => handleRating(star)}
            style={{ cursor: isSubmitting ? 'wait' : 'pointer' }}
          />
        ))}
      </div>
      <span className="product-card__reviews">({localTotal})</span>
      <span className="product-card__sold">| Đã bán {product.da_ban || 0}</span>
    </div>
  );
}

export default InteractiveStarRating;
