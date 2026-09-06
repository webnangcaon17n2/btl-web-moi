import { useState, useEffect } from 'react'
import { FiPackage, FiShoppingBag, FiUsers, FiDollarSign, FiTrendingUp, FiTrendingDown, FiFileText, FiStar, FiBox } from 'react-icons/fi'
import { API_BASE } from '../../config/api'
import '../Admin/ProductManager.css'
import './Dashboard.css'

function Dashboard() {
  const [data, setData] = useState({
    totalProducts: 0,
    monthlyOrders: 0,
    monthlyRevenue: 0,
    totalUsers: 0,
    recentOrders: [],
    topProducts: [],
    inventoryStats: { totalInventory: 0, lowStock: 0 },
    monthlyChart: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/thong-ke`)
      .then(res => res.json())
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      });
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatMillion = (amount) => {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M ₫';
    }
    return formatCurrency(amount);
  };

  const stats = [
    { label: 'Tổng sản phẩm', value: data.totalProducts, icon: <FiPackage size={22} />, change: '+0', up: true, color: '#4caf50' },
    { label: 'Đơn hàng tháng', value: data.monthlyOrders, icon: <FiShoppingBag size={22} />, change: '+0', up: true, color: '#2196f3' },
    { label: 'Doanh thu tháng', value: formatMillion(data.monthlyRevenue), icon: <FiDollarSign size={22} />, change: '+0%', up: true, color: '#ff9800' },
    { label: 'Người dùng', value: data.totalUsers, icon: <FiUsers size={22} />, change: '+0', up: true, color: '#9c27b0' },
  ];

  // Nếu chưa có chart data thì tính max để scale bar chart
  const maxChartValue = Math.max(30, ...(data.monthlyChart.map(m => Math.max(m.revenue, m.expense))));

  if (loading) {
    return <div className="pm"><div className="pm-page-header"><h2>Đang tải dữ liệu...</h2></div></div>;
  }

  return (
    <div className="pm">
      <div className="pm-page-header">
        <div className="pm-page-header__left">
          <h1>Tổng quan</h1>
          <p>Tổng quan hoạt động kinh doanh của cửa hàng</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dash-stats">
        {stats.map((stat, i) => (
          <div key={i} className="dash-stat-card">
            <div className="dash-stat-card__icon" style={{ background: stat.color + '15', color: stat.color }}>
              {stat.icon}
            </div>
            <div className="dash-stat-card__info">
              <div className="dash-stat-card__value">{stat.value}</div>
              <div className="dash-stat-card__label">{stat.label}</div>
            </div>
            <div className={`dash-stat-card__change ${stat.up ? 'dash-stat-card__change--up' : 'dash-stat-card__change--down'}`}>
              {stat.up ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="dash-grid">
        {/* Revenue Chart */}
        <div className="dash-card dash-card--lg">
          <div className="dash-card__header">
            <h3>Doanh thu & Chi phí</h3>
            <span className="dash-card__subtitle">4 tháng gần nhất (triệu ₫)</span>
          </div>
          <div className="dash-chart-bars">
            {data.monthlyChart.length > 0 ? data.monthlyChart.map((m, i) => (
              <div key={i} className="dash-chart-bar-group">
                <div className="dash-chart-bar-container">
                  <div className="dash-chart-bar dash-chart-bar--revenue" style={{ height: `${(m.revenue / maxChartValue) * 100}%` }}>
                    <span className="dash-chart-bar__tooltip">{m.revenue.toFixed(1)}M</span>
                  </div>
                  <div className="dash-chart-bar dash-chart-bar--expense" style={{ height: `${(m.expense / maxChartValue) * 100}%` }}>
                    <span className="dash-chart-bar__tooltip">{m.expense.toFixed(1)}M</span>
                  </div>
                </div>
                <span className="dash-chart-bar__label">{m.month}</span>
              </div>
            )) : <div style={{padding: '2rem'}}>Không có dữ liệu</div>}
          </div>
          <div className="dash-chart-legend">
            <span className="dash-chart-legend__item"><span className="dash-chart-legend__dot" style={{ background: '#4caf50' }}></span>Doanh thu</span>
            <span className="dash-chart-legend__item"><span className="dash-chart-legend__dot" style={{ background: '#ff9800' }}></span>Chi phí</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="dash-card">
          <div className="dash-card__header">
            <h3>Tình trạng kho</h3>
          </div>
          <div className="dash-inventory-stats">
            <div className="dash-inv-item">
              <div className="dash-inv-item__icon" style={{ background: '#e8f5e9', color: '#4caf50' }}><FiBox size={18} /></div>
              <div>
                <div className="dash-inv-item__value">{data.inventoryStats.totalInventory}</div>
                <div className="dash-inv-item__label">Tổng tồn kho</div>
              </div>
            </div>
            <div className="dash-inv-item">
              <div className="dash-inv-item__icon" style={{ background: '#fff3e0', color: '#e65100' }}><FiPackage size={18} /></div>
              <div>
                <div className="dash-inv-item__value">{data.inventoryStats.lowStock}</div>
                <div className="dash-inv-item__label">Sắp hết hàng</div>
              </div>
            </div>
            <div className="dash-inv-item">
              <div className="dash-inv-item__icon" style={{ background: '#e3f2fd', color: '#1565c0' }}><FiFileText size={18} /></div>
              <div>
                <div className="dash-inv-item__value">10</div>
                <div className="dash-inv-item__label">Bài viết</div>
              </div>
            </div>
            <div className="dash-inv-item">
              <div className="dash-inv-item__icon" style={{ background: '#f3e5f5', color: '#7b1fa2' }}><FiStar size={18} /></div>
              <div>
                <div className="dash-inv-item__value">4.5 <FiStar size={14} style={{ fill: '#f5c518', color: '#f5c518', verticalAlign: 'middle' }} /></div>
                <div className="dash-inv-item__label">Đánh giá TB</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="dash-grid">
        {/* Recent Orders */}
        <div className="dash-card">
          <div className="dash-card__header">
            <h3>Đơn hàng gần đây</h3>
          </div>
          <table className="dash-table">
            <thead>
              <tr><th>Mã đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              {data.recentOrders.length > 0 ? data.recentOrders.map(o => (
                <tr key={o.id}>
                  <td><strong>{o.id}</strong></td>
                  <td>{o.customer}</td>
                  <td>{formatCurrency(o.total)}</td>
                  <td><span className="dash-status" style={{ color: o.statusColor, background: o.statusColor + '15' }}>{o.status}</span></td>
                </tr>
              )) : <tr><td colSpan="4" style={{textAlign: 'center', padding: '1rem'}}>Chưa có đơn hàng nào</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Top Products */}
        <div className="dash-card">
          <div className="dash-card__header">
            <h3>Sản phẩm bán chạy</h3>
          </div>
          <table className="dash-table">
            <thead>
              <tr><th>Sản phẩm</th><th>Đã bán</th><th>Doanh thu</th></tr>
            </thead>
            <tbody>
              {data.topProducts.length > 0 ? data.topProducts.map((p, i) => (
                <tr key={i}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.sold}</td>
                  <td>{formatCurrency(p.revenue)}</td>
                </tr>
              )) : <tr><td colSpan="3" style={{textAlign: 'center', padding: '1rem'}}>Chưa có dữ liệu</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
