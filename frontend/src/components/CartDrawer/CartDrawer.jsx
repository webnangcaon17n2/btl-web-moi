import { useNavigate } from 'react-router-dom'
import { FiX, FiPlus, FiMinus, FiTrash2, FiShoppingBag } from 'react-icons/fi'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import './CartDrawer.css'

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

function CartDrawer() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { isCartOpen, setIsCartOpen, setIsCheckoutOpen, cartItems, cartCount, cartTotal, updateQuantity, removeItem, clearCart } = useCart()

  const handleCheckout = () => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập để thực hiện thanh toán!')
      setIsCartOpen(false)
      navigate('/login')
      return
    }

    if (cartItems.length === 0) return

    setIsCartOpen(false)
    navigate('/checkout')
  }

  return (
    <>
      <div 
        className={`cart-overlay ${isCartOpen ? 'open' : ''}`} 
        onClick={() => setIsCartOpen(false)}
      ></div>
      
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">Giỏ hàng của bạn ({cartCount})</h2>
          <button className="cart-drawer__close" onClick={() => setIsCartOpen(false)}>
            <FiX size={24} strokeWidth={1.5} />
          </button>
        </div>

        <div className="cart-drawer__body">
          {cartItems.length === 0 ? (
            <div className="cart-drawer__empty">
              <FiShoppingBag size={48} strokeWidth={1} />
              <p>Giỏ hàng của bạn đang trống</p>
            </div>
          ) : (
            <div className="cart-drawer__items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <img 
                    src={item.anh_bia || `https://placehold.co/100x100/e8f5e9/4caf50?text=${encodeURIComponent(item.ten_san_pham)}`} 
                    alt={item.ten_san_pham} 
                    className="cart-item__image"
                  />
                  <div className="cart-item__details">
                    <div className="cart-item__header">
                      <h3 className="cart-item__title">{item.ten_san_pham}</h3>
                      <button 
                        className="cart-item__remove" 
                        onClick={() => removeItem(item.id)}
                        aria-label="Xóa sản phẩm"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="cart-item__price">{formatVND(item.gia_ban)}</div>
                    
                    <div className="cart-item__actions">
                      <div className="cart-quantity">
                        <button onClick={() => updateQuantity(item.id, -1)} disabled={item.quantity <= 1}>
                          <FiMinus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)}>
                          <FiPlus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cart-drawer__footer">
          <div className="cart-drawer__summary">
            <span>Tổng tạm tính:</span>
            <strong>{formatVND(cartTotal)}</strong>
          </div>
          <button 
            className="cart-drawer__checkout" 
            disabled={cartItems.length === 0}
            onClick={handleCheckout}
          >
            Thanh toán ngay
          </button>
        </div>
      </div>
    </>
  )
}

export default CartDrawer
