import { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [token, setToken] = useState(sessionStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)
  
  // Kiểm tra Session khi khởi tạo ứng dụng (Thay localStorage bằng sessionStorage)
  useEffect(() => {
    // Dọn dẹp localStorage cũ nếu còn tồn tại (để chuyển hẳn sang sessionStorage)
    localStorage.removeItem('currentUser')
    localStorage.removeItem('token')

    const storedUser = sessionStorage.getItem('currentUser')
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser))
      } catch (err) {
        console.error('Lỗi khi parse user từ sessionStorage:', err)
        sessionStorage.removeItem('currentUser')
      }
    }
    const storedToken = sessionStorage.getItem('token')
    if (storedToken) setToken(storedToken)
    
    setLoading(false)
  }, [])

  const login = (user) => {
    setCurrentUser(user)
    sessionStorage.setItem('currentUser', JSON.stringify(user))
    if (user.token) {
      setToken(user.token)
      sessionStorage.setItem('token', user.token)
    }
  }

  const logout = () => {
    setCurrentUser(null)
    setToken(null)
    sessionStorage.removeItem('currentUser')
    sessionStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ currentUser, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
