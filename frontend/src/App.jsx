import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header/Header'
import Hero from './components/Hero/Hero'
import Blog from './components/Blog/Blog'
import Testimonials from './components/Testimonials/Testimonials'
import Pricing from './components/Pricing/Pricing'
import Newsletter from './components/Newsletter/Newsletter'
import Footer from './components/Footer/Footer'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Shop from './pages/Shop/Shop'
import Products from './pages/Products/Products'
import Checkout from './pages/Checkout/Checkout'
import MyOrders from './pages/MyOrders/MyOrders'
import Profile from './pages/Profile/Profile'
import AdminLayout from './pages/Admin/AdminLayout'
import Dashboard from './pages/Admin/Dashboard'
import ProductManager from './pages/Admin/ProductManager'
import BlogManager from './pages/Admin/BlogManager'
import OrderManager from './pages/Admin/OrderManager'
import FinanceManager from './pages/Admin/FinanceManager'
import InventoryManager from './pages/Admin/InventoryManager'
import SupplierManager from './pages/Admin/SupplierManager'
import UserManager from './pages/Admin/UserManager'
import ReviewManager from './pages/Admin/ReviewManager'
import BugReportManager from './pages/Admin/BugReportManager'
import PaymentConfig from './pages/Admin/ConfigManager/PaymentConfig'
import AccountConfig from './pages/Admin/ConfigManager/AccountConfig'
import FeedbackManager from './pages/Admin/FeedbackManager'
import CartDrawer from './components/CartDrawer/CartDrawer'
import Chatbot from './components/Chatbot/Chatbot'
import MyOrdersModal from './components/MyOrdersModal/MyOrdersModal'
import UserProfileModal from './components/UserProfileModal/UserProfileModal'
import AboutUs from './pages/AboutUs/AboutUs'
import Contact from './pages/Contact/Contact'
import AllReviews from './pages/AllReviews/AllReviews'
import ExpertManager from './pages/Admin/ExpertManager'
import { useAuth } from './context/AuthContext'
import { useCart } from './context/CartContext'
import './App.css'



// Component xử lý cuộn đến phần hash (#blog, #about, vọt.)
const ScrollToHash = () => {
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      const element = document.getElementById(id)
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' })
        }, 100) // Đợi component render xong
      }
    }
  }, [hash])
  return null
}

// Thành phần bảo vệ route cho Người dùng (Phải đăng nhập mới xem được)
const UserRoute = ({ children }) => {
  const { currentUser, loading } = useAuth()
  
  if (loading) return null // Chờ kiểm tra localStorage

  // Nếu chưa đăng nhập, bắt buộc vào trang login
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // Admin vẫn được xem trang người dùng (không redirect về /admin)
  return children
}

// Thành phần bảo vệ route cho Admin (Chỉ cho Admin vào)
const AdminRoute = ({ children }) => {
  const { currentUser, loading } = useAuth()

  if (loading) return null // Chờ kiểm tra localStorage

  if (!currentUser || !currentUser.la_admin) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Thành phần bảo vệ route Công khai (Đã đăng nhập thì không vào Login/Register nữa)
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth()

  if (loading) return null

  if (currentUser) {
    return <Navigate to={currentUser.la_admin ? "/admin" : "/"} replace />
  }
  return children
}

function HomePage() {
  return (
    <>
      <main>
        <Hero />
        <Blog />
        <Testimonials />
        <Pricing />
        <Newsletter />
      </main>
    </>
  )
}

function App() {
  const { isCheckoutOpen, setIsCheckoutOpen } = useCart()
  const [isOrdersOpen, setIsOrdersOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const location = useLocation()
  
  // Tự động mở Modal đơn hàng nếu được chuyển hướng từ Checkout
  useEffect(() => {
    if (location.state?.openOrders) {
      setIsOrdersOpen(true)
      // Xóa state để tránh việc load lại trang bị mở lại modal
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Kiểm tra nếu là trang Admin hoặc Login/Register để ẩn Header/Footer/Cart/Chat
  const isAdminPath = location.pathname.startsWith('/admin')
  const isAuthPath = location.pathname === '/login' || location.pathname === '/register'
  const hideHeaderFooter = isAdminPath || isAuthPath
  
  return (
    <div className="app">
      <ScrollToHash />
      {!hideHeaderFooter && (
        <Header 
          onOpenOrders={() => setIsOrdersOpen(true)} 
          onOpenProfile={() => setIsProfileOpen(true)}
        />
      )}
      {!hideHeaderFooter && <CartDrawer />}
      {!hideHeaderFooter && <Chatbot />}
      <Routes>
        {/* Các route của Người dùng - Phải đăng nhập mới xem được */}
        <Route path="/" element={<UserRoute><HomePage /></UserRoute>} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/products" element={<UserRoute><Products /></UserRoute>} />
        <Route path="/checkout" element={<UserRoute><Checkout /></UserRoute>} />
        <Route path="/my-orders" element={<UserRoute><MyOrders /></UserRoute>} />
        <Route path="/profile" element={<UserRoute><Profile /></UserRoute>} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/about-us" element={<Navigate to="/about" replace />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/all-reviews" element={<AllReviews />} />
        
        {/* Route Đăng nhập/Đăng ký */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Các route của Admin - Vẫn giữ bảo mật chỉ Admin được vào */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ProductManager />} />
          <Route path="blogs" element={<BlogManager />} />
          <Route path="orders" element={<OrderManager />} />
          <Route path="finance" element={<FinanceManager />} />
          <Route path="inventory" element={<InventoryManager />} />
          <Route path="suppliers" element={<SupplierManager />} />
          <Route path="users" element={<UserManager />} />
          <Route path="reviews" element={<ReviewManager />} />
          <Route path="experts" element={<ExpertManager />} />
          <Route path="feedbacks" element={<FeedbackManager />} />
          <Route path="config">
            <Route index element={<Navigate to="/admin/config/payment" replace />} />
            <Route path="payment" element={<PaymentConfig />} />
            <Route path="accounts" element={<AccountConfig />} />
          </Route>
          <Route path="bug-reports" element={<BugReportManager />} />
        </Route>
      </Routes>

      {!hideHeaderFooter && <Footer />}

      {/* Cửa sổ lịch sử đơn hàng */}
      <MyOrdersModal 
        isOpen={isOrdersOpen} 
        onClose={() => setIsOrdersOpen(false)} 
      />

      <MyOrdersModal 
        isOpen={isOrdersOpen} 
        onClose={() => setIsOrdersOpen(false)} 
      />
    </div>
  )
}

export default App
