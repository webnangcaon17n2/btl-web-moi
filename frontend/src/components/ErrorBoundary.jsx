import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          padding: '40px',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
          <h2 style={{ fontSize: '24px', color: '#1b4332', marginBottom: '12px' }}>
            Đã xảy ra lỗi khi tải giao diện
          </h2>
          <p style={{ color: '#666', maxWidth: '500px', marginBottom: '24px', lineHeight: '1.6' }}>
            Hệ thống đang gặp sự cố nhỏ khi hiển thị nội dung này. Bạn vui lòng thử tải lại trang hoặc quay lại trang chủ nhé.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                backgroundColor: '#2d6a4f',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Tải lại trang
            </button>
            <button
              onClick={() => { window.location.href = '/' }}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                backgroundColor: '#e8f5e9',
                color: '#2d6a4f',
                border: '1px solid #b7e4c7',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Về trang chủ
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
