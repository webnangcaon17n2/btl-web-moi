import { createContext, useState, useContext, useEffect } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export const useCart = () => useContext(CartContext)

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  // Khóa để lưu trữ trong localStorage (phân biệt theo user)
  const cartKey = currentUser ? `cart_${currentUser.id}` : 'cart_guest'

  // 1. Tải giỏ hàng khi khởi tạo hoặc khi đổi user
  useEffect(() => {
    const savedCart = localStorage.getItem(cartKey)
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart))
      } catch (err) {
        console.error('Lỗi tải giỏ hàng:', err)
        setCartItems([])
      }
    } else {
      setCartItems([])
    }
  }, [cartKey])

  // 2. Lưu giỏ hàng mỗi khi có thay đổi
  useEffect(() => {
    if (cartItems.length > 0 || localStorage.getItem(cartKey)) {
      localStorage.setItem(cartKey, JSON.stringify(cartItems))
    }
  }, [cartItems, cartKey])

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cartItems.reduce((total, item) => total + item.gia_ban * item.quantity, 0)

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (id, amount) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity + amount
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
        }
        return item
      })
    })
  }

  const removeItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id))
  }

  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem(cartKey)
  }

  return (
    <CartContext.Provider value={{ 
      cartItems, cartCount, cartTotal, addToCart, 
      updateQuantity, removeItem, clearCart,
      isCartOpen, setIsCartOpen, isCheckoutOpen, setIsCheckoutOpen
    }}>
      {children}
    </CartContext.Provider>
  )
}
