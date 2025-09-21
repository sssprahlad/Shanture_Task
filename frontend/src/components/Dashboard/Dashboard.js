import React, { useState, useEffect } from 'react';
import axios from 'axios';

const mockData = {
  revenue: {
    totalRevenue: 847520,
    totalOrders: 1247,
    avgOrderValue: 679.32,
    uniqueCustomers: 342
  },
  monthlyTrend: [
    { month: '2024-01', revenue: 67000, orders: 89 },
    { month: '2024-02', revenue: 78000, orders: 112 },
    { month: '2024-03', revenue: 89000, orders: 134 },
    { month: '2024-04', revenue: 95000, orders: 142 },
    { month: '2024-05', revenue: 87000, orders: 128 },
    { month: '2024-06', revenue: 102000, orders: 156 },
    { month: '2024-07', revenue: 110000, orders: 167 },
    { month: '2024-08', revenue: 98000, orders: 145 },
    { month: '2024-09', revenue: 112000, orders: 178 }
  ],
  topProducts: [
    { name: 'Wireless Headphones', category: 'Electronics', totalRevenue: 125000, totalQuantity: 234 },
    { name: 'Gaming Laptop', category: 'Electronics', totalRevenue: 98000, totalQuantity: 89 },
    { name: 'Smart Watch', category: 'Electronics', totalRevenue: 87000, totalQuantity: 156 },
    { name: 'Bluetooth Speaker', category: 'Electronics', totalRevenue: 76000, totalQuantity: 203 },
    { name: 'Tablet Pro', category: 'Electronics', totalRevenue: 65000, totalQuantity: 98 }
  ],
  regionStats: [
    { region: 'North', totalRevenue: 235000, totalOrders: 345, color: '#1976d2' },
    { region: 'South', totalRevenue: 189000, totalOrders: 278, color: '#2e7d32' },
    { region: 'East', totalRevenue: 167000, totalOrders: 234, color: '#ed6c02' },
    { region: 'West', totalRevenue: 145000, totalOrders: 212, color: '#9c27b0' },
    { region: 'Central', totalRevenue: 111000, totalOrders: 178, color: '#d32f2f' }
  ],
  topCustomers: [
    { name: 'TechCorp Inc', region: 'North', totalSpent: 45000, orderCount: 23 },
    { name: 'Global Solutions', region: 'West', totalSpent: 38000, orderCount: 19 },
    { name: 'Innovate LLC', region: 'East', totalSpent: 32000, orderCount: 16 },
    { name: 'Future Systems', region: 'South', totalSpent: 28000, orderCount: 14 },
    { name: 'Digital Dynamics', region: 'Central', totalSpent: 25000, orderCount: 12 }
  ],
  reports: [
    {
      id: 1,
      report_date: '2024-09-20',
      total_revenue: 847520,
      total_orders: 1247,
      avg_order_value: 679.32,
      top_product: 'Wireless Headphones',
      top_region: 'North',
      status: 'Complete'
    },
    {
      id: 2,
      report_date: '2024-09-19',
      total_revenue: 798340,
      total_orders: 1189,
      avg_order_value: 671.25,
      top_product: 'Gaming Laptop',
      top_region: 'West',
      status: 'Complete'
    },
    {
      id: 3,
      report_date: '2024-09-18',
      total_revenue: 723890,
      total_orders: 1098,
      avg_order_value: 659.25,
      top_product: 'Smart Watch',
      top_region: 'East',
      status: 'Processing'
    }
  ]
};

const Dashboard = () => {
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-09-20');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(mockData);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Custom Line Chart Component
  const LineChart = ({ data: chartData, title }) => {
    if (!chartData || chartData.length === 0) return <div style={{ padding: '20px' }}>No data available</div>;
    
    const maxValue = Math.max(...chartData.map(d => d.revenue));
    const chartWidth = 500;
    const chartHeight = 300;
    
    return (
      <div style={{ padding: '20px', height: '350px' }}>
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
          {/* Background grid */}
          {[0, 1, 2, 3, 4].map(i => (
            <line 
              key={i}
              x1="60" 
              y1={50 + (i * (chartHeight - 100) / 4)} 
              x2={chartWidth - 40} 
              y2={50 + (i * (chartHeight - 100) / 4)}
              stroke="#e0e0e0" 
              strokeWidth="1"
            />
          ))}
          
          {/* Chart area fill */}
          <path
            d={`M 60 ${chartHeight - 50} ${chartData.map((d, i) => {
              const x = 60 + (i / (chartData.length - 1)) * (chartWidth - 100);
              const y = chartHeight - 50 - ((d.revenue / maxValue) * (chartHeight - 100));
              return `L ${x} ${y}`;
            }).join(' ')} L ${chartWidth - 40} ${chartHeight - 50} Z`}
            fill="url(#gradient)"
            opacity="0.3"
          />
          
          {/* Chart line */}
          <path
            d={`M ${chartData.map((d, i) => {
              const x = 60 + (i / (chartData.length - 1)) * (chartWidth - 100);
              const y = chartHeight - 50 - ((d.revenue / maxValue) * (chartHeight - 100));
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}`}
            fill="none"
            stroke="#1976d2"
            strokeWidth="3"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(25, 118, 210, 0.3))' }}
          />
          
          {/* Data points */}
          {chartData.map((d, i) => {
            const x = 60 + (i / (chartData.length - 1)) * (chartWidth - 100);
            const y = chartHeight - 50 - ((d.revenue / maxValue) * (chartHeight - 100));
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="5"
                fill="#1976d2"
                stroke="white"
                strokeWidth="2"
                className="chart-point"
              />
            );
          })}
          
          {/* X-axis labels */}
          {chartData.map((d, i) => {
            const x = 60 + (i / (chartData.length - 1)) * (chartWidth - 100);
            const date = new Date(d.month + '-01');
            const label = date.toLocaleDateString('en-US', { month: 'short' });
            return (
              <text
                key={i}
                x={x}
                y={chartHeight - 20}
                textAnchor="middle"
                fill="#666"
                fontSize="12"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {label}
              </text>
            );
          })}
          
          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4].map(i => {
            const value = (maxValue / 4) * (4 - i);
            const y = 50 + (i * (chartHeight - 100) / 4);
            return (
              <text
                key={i}
                x="55"
                y={y + 4}
                textAnchor="end"
                fill="#666"
                fontSize="12"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                ${Math.round(value / 1000)}K
              </text>
            );
          })}
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1976d2" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#1976d2" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  // Custom Bar Chart Component
  const BarChart = ({ data: chartData, title, horizontal = false }) => {
    if (!chartData || chartData.length === 0) return <div style={{ padding: '20px' }}>No data available</div>;
    
    const maxValue = Math.max(...chartData.map(d => d.totalRevenue || d.totalSpent || 0));
    
    if (horizontal) {
      return (
        <div style={{ padding: '20px', height: '350px' }}>
          {chartData.map((item, i) => {
            const percentage = ((item.totalRevenue || 0) / maxValue) * 100;
            return (
              <div key={i} style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#333',
                    maxWidth: '150px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.name}
                  </span>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: '#1976d2'
                  }}>
                    ${Math.round((item.totalRevenue || 0) / 1000)}K
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '12px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #2e7d32, #1976d2)',
                      borderRadius: '6px',
                      transition: 'width 1s ease-out'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Vertical bars for customers
    return (
      <div style={{ 
        padding: '20px', 
        height: '350px', 
        display: 'flex', 
        alignItems: 'flex-end', 
        justifyContent: 'space-around' 
      }}>
        {chartData.map((item, i) => {
          const height = ((item.totalSpent || 0) / maxValue) * 250;
          return (
            <div key={i} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              margin: '0 5px' 
            }}>
              <div
                style={{
                  width: '50px',
                  height: `${height}px`,
                  background: 'linear-gradient(180deg, #9c27b0, #1976d2)',
                  borderRadius: '8px 8px 0 0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '600',
                  paddingTop: '8px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
              >
                ${Math.round((item.totalSpent || 0) / 1000)}K
              </div>
              <span style={{ 
                fontSize: '11px', 
                color: '#666', 
                textAlign: 'center', 
                marginTop: '8px',
                maxWidth: '60px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {(item.name || '').substring(0, 10)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Custom Pie Chart Component
  const PieChart = ({ data: chartData, title }) => {
    if (!chartData || chartData.length === 0) return <div style={{ padding: '20px' }}>No data available</div>;
    
    const total = chartData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
    
    return (
      <div style={{ 
        padding: '20px', 
        height: '350px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <div style={{ width: '200px', height: '200px', position: 'relative' }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            {chartData.map((item, i) => {
              const percentage = ((item.totalRevenue || 0) / total) * 100;
              const startAngle = chartData.slice(0, i).reduce((sum, d) => sum + ((d.totalRevenue || 0) / total) * 360, 0);
              const endAngle = startAngle + (percentage * 360 / 100);
              
              const startAngleRad = (startAngle - 90) * (Math.PI / 180);
              const endAngleRad = (endAngle - 90) * (Math.PI / 180);
              
              const largeArcFlag = percentage > 50 ? 1 : 0;
              
              const x1 = 100 + 80 * Math.cos(startAngleRad);
              const y1 = 100 + 80 * Math.sin(startAngleRad);
              const x2 = 100 + 80 * Math.cos(endAngleRad);
              const y2 = 100 + 80 * Math.sin(endAngleRad);
              
              if (percentage === 0) return null;
              
              const pathData = [
                `M 100 100`,
                `L ${x1} ${y1}`,
                `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');
              
              return (
                <path
                  key={i}
                  d={pathData}
                  fill={item.color}
                  stroke="white"
                  strokeWidth="3"
                  className="pie-slice"
                  style={{ 
                    cursor: 'pointer',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }}
                />
              );
            })}
            
            {/* Center circle for donut effect */}
            <circle cx="100" cy="100" r="40" fill="white" stroke="#e0e0e0" strokeWidth="2" />
            <text x="100" y="95" textAnchor="middle" fill="#666" fontSize="12" fontWeight="600" fontFamily="system-ui">
              Total
            </text>
            <text x="100" y="110" textAnchor="middle" fill="#333" fontSize="14" fontWeight="700" fontFamily="system-ui">
              ${Math.round(total / 1000)}K
            </text>
          </svg>
        </div>
        
        <div style={{ marginLeft: '30px', maxWidth: '180px' }}>
          {chartData.map((item, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '12px',
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.02)',
              transition: 'background-color 0.2s ease'
            }}>
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  backgroundColor: item.color,
                  borderRadius: '3px',
                  marginRight: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '2px'
                }}>
                  {item.region}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#666'
                }}>
                  {(((item.totalRevenue || 0) / total) * 100).toFixed(1)}% • ${Math.round((item.totalRevenue || 0) / 1000)}K
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Simulate data loading
  const updateData = () => {
    setLoading(true);
    setTimeout(() => {
      const newRevenue = Math.floor(Math.random() * 900000) + 100000;
      const newOrders = Math.floor(Math.random() * 1500) + 500;
      setData(prev => ({
        ...prev,
        revenue: {
          ...prev.revenue,
          totalRevenue: newRevenue,
          totalOrders: newOrders,
          avgOrderValue: newRevenue / newOrders
        }
      }));
      setLoading(false);
      setNotification({
        show: true,
        message: 'Dashboard updated successfully!',
        type: 'success'
      });
    }, 1000);
  };

  const generateReport = () => {
    setNotification({
      show: true,
      message: 'Analytics report generated and saved!',
      type: 'success'
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
          border: '1px solid rgba(255, 255, 255, 0.18)'
        }}>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            color: '#1976d2', 
            fontSize: '2.5rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            📊 Sales Analytics Dashboard
          </h1>
          <p style={{ color: '#666', margin: '0 0 24px 0', fontSize: '1.1rem' }}>
            Real-time insights into your sales performance
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>📅</span>
              <label style={{ fontWeight: '600', color: '#1976d2', fontSize: '1rem' }}>Date Range:</label>
            </div>
            
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '2px solid #e3f2fd',
                borderRadius: '12px',
                fontSize: '14px',
                backgroundColor: 'white',
                outline: 'none',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1976d2'}
              onBlur={(e) => e.target.style.borderColor = '#e3f2fd'}
            />
            
            <span style={{ color: '#666', fontWeight: '500' }}>to</span>
            
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '2px solid #e3f2fd',
                borderRadius: '12px',
                fontSize: '14px',
                backgroundColor: 'white',
                outline: 'none',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1976d2'}
              onBlur={(e) => e.target.style.borderColor = '#e3f2fd'}
            />
            
            <button
              onClick={updateData}
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(25, 118, 210, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.3)';
                }
              }}
            >
              🔄 {loading ? 'Updating...' : 'Update Dashboard'}
            </button>
            
            <button
              onClick={generateReport}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(46, 125, 50, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(46, 125, 50, 0.3)';
              }}
            >
              📊 Generate Report
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {[
            { 
              label: 'Total Revenue', 
              value: `$${data.revenue.totalRevenue.toLocaleString()}`, 
              icon: '💰', 
              color: '#2e7d32',
              bgColor: '#e8f5e8'
            },
            { 
              label: 'Total Orders', 
              value: data.revenue.totalOrders.toLocaleString(), 
              icon: '🛍️', 
              color: '#1976d2',
              bgColor: '#e3f2fd'
            },
            { 
              label: 'Avg Order Value', 
              value: `$${Math.round(data.revenue.avgOrderValue)}`, 
              icon: '📈', 
              color: '#ed6c02',
              bgColor: '#fff3e0'
            },
            { 
              label: 'Active Customers', 
              value: data.revenue.uniqueCustomers.toLocaleString(), 
              icon: '👥', 
              color: '#9c27b0',
              bgColor: '#f3e5f5'
            }
          ].map((metric, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(31, 38, 135, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.37)';
            }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '80px',
                height: '80px',
                background: metric.bgColor,
                borderRadius: '0 16px 0 80px',
                opacity: 0.6
              }} />
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '20px',
                position: 'relative'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: metric.bgColor,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {metric.icon}
                </div>
                {loading && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '3px solid #e0e0e0',
                    borderTop: '3px solid ' + metric.color,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
              </div>
              
              <div style={{ 
                color: '#666', 
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {metric.label}
              </div>
              
              <div style={{ 
                fontSize: '2.2rem', 
                fontWeight: '700',
                color: metric.color,
                marginBottom: '4px'
              }}>
                {loading ? '...' : metric.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(550px, 1fr))',
          gap: '32px',
          marginBottom: '32px'
        }}>
          {/* Revenue Chart */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
            border: '1px solid rgba(255, 255, 255, 0.18)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.5rem' }}>📈</span>
              <h3 style={{ 
                color: '#1976d2', 
                margin: 0, 
                fontSize: '1.3rem',
                fontWeight: '600'
              }}>
                Monthly Revenue Trend
              </h3>
            </div>
            <div style={{ height: '2px', background: 'linear-gradient(90deg, #e0e0e0, #1976d2, #e0e0e0)', marginBottom: '16px', borderRadius: '1px' }} />
            <LineChart data={data.monthlyTrend} title="Monthly Revenue Trend" />
          </div>

          {/* Products Chart */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
            border: '1px solid rgba(255, 255, 255, 0.18)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.5rem' }}>🏆</span>
              <h3 style={{ 
                color: '#1976d2', 
                margin: 0, 
                fontSize: '1.3rem',
                fontWeight: '600'
              }}>
                Top Products by Revenue
              </h3>
            </div>
            <div style={{ height: '2px', background: 'linear-gradient(90deg, #e0e0e0, #2e7d32, #e0e0e0)', marginBottom: '16px', borderRadius: '1px' }} />
            <BarChart data={data.topProducts} title="Top Products by Revenue" horizontal={true} />
          </div>

          {/* Region Chart */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
            border: '1px solid rgba(255, 255, 255, 0.18)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.5rem' }}>🗺️</span>
              <h3 style={{ 
                color: '#1976d2', 
                margin: 0, 
                fontSize: '1.3rem',
                fontWeight: '600'
              }}>
                Regional Performance
              </h3>
            </div>
            <div style={{ height: '2px', background: 'linear-gradient(90deg, #e0e0e0, #9c27b0, #e0e0e0)', marginBottom: '16px', borderRadius: '1px' }} />
            <PieChart data={data.regionStats} title="Regional Performance" />
          </div>

          {/* Customers Chart */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
            border: '1px solid rgba(255, 255, 255, 0.18)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.5rem' }}>👥</span>
              <h3 style={{ 
                color: '#1976d2', 
                margin: 0, 
                fontSize: '1.3rem',
                fontWeight: '600'
              }}>
                Top Customers
              </h3>
            </div>
            <div style={{ height: '2px', background: 'linear-gradient(90deg, #e0e0e0, #ed6c02, #e0e0e0)', marginBottom: '16px', borderRadius: '1px' }} />
            <BarChart data={data.topCustomers} title="Top Customers" horizontal={false} />
          </div>
        </div>

        {/* Reports Table */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          overflowX: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '1.5rem' }}>📋</span>
            <h3 style={{ 
              color: '#1976d2', 
              margin: 0, 
              fontSize: '1.3rem',
              fontWeight: '600'
            }}>
              Recent Analytics Reports
            </h3>
          </div>
          <div style={{ height: '2px', background: 'linear-gradient(90deg, #e0e0e0, #1976d2, #e0e0e0)', marginBottom: '20px', borderRadius: '1px' }} />
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ 
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '8px'
                }}>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #dee2e6',
                    borderTopLeftRadius: '8px'
                  }}>Report Date</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #dee2e6'
                  }}>Total Revenue</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #dee2e6'
                  }}>Orders</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #dee2e6'
                  }}>Avg Order Value</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #dee2e6'
                  }}>Top Product</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #dee2e6'
                  }}>Top Region</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #dee2e6',
                    borderTopRightRadius: '8px'
                  }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.reports.map((report, index) => (
                  <tr key={report.id} style={{ 
                    borderBottom: '1px solid #dee2e6',
                    transition: 'background-color 0.2s ease',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px', color: '#495057' }}>{report.report_date}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        fontWeight: '600', 
                        color: '#2e7d32',
                        fontSize: '15px'
                      }}>
                        ${report.total_revenue.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#495057' }}>
                      {report.total_orders.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', color: '#495057' }}>
                      ${Math.round(report.avg_order_value)}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        color: '#1976d2',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        border: '1px solid #90caf9'
                      }}>
                        {report.top_product}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                        color: '#9c27b0',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        border: '1px solid #ce93d8'
                      }}>
                        {report.top_region}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        background: report.status === 'Complete' ? 
                          'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)' : 
                          'linear-gradient(135deg, #fff3e0 0%, #ffcc02 20%)',
                        color: report.status === 'Complete' ? '#2e7d32' : '#e65100',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: report.status === 'Complete' ? '1px solid #81c784' : '1px solid #ffb74d'
                      }}>
                        {report.status === 'Complete' ? '✅ Complete' : '⏳ Processing'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={updateData}
          disabled={loading}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: loading ? '#ccc' : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '24px',
            boxShadow: '0 4px 20px rgba(25, 118, 210, 0.4)',
            transition: 'all 0.3s ease',
            zIndex: 1000
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 6px 24px rgba(25, 118, 210, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 20px rgba(25, 118, 210, 0.4)';
            }
          }}
        >
          {loading ? '⏳' : '🔄'}
        </button>

        {/* Notification */}
        {notification.show && (
          <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: notification.type === 'success' ? 
              'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)' : 
              'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            zIndex: 1001,
            fontSize: '14px',
            fontWeight: '600',
            maxWidth: '300px',
            animation: 'slideInRight 0.4s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '18px' }}>
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            {notification.message}
            <button
              onClick={closeNotification}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px',
                marginLeft: 'auto',
                padding: '0',
                opacity: 0.7,
                transition: 'opacity 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '1'}
              onMouseLeave={(e) => e.target.style.opacity = '0.7'}
            >
              ×
            </button>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes slideInRight {
            from { 
              transform: translateX(100%); 
              opacity: 0; 
            }
            to { 
              transform: translateX(0); 
              opacity: 1; 
            }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .chart-point {
            transition: all 0.3s ease;
          }
          
          .chart-point:hover {
            r: 7;
            fill: #1565c0;
          }
          
          .pie-slice {
            transition: all 0.3s ease;
            transform-origin: 100px 100px;
          }
          
          .pie-slice:hover {
            transform: scale(1.02);
            filter: brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.2));
          }
          
          @media (max-width: 768px) {
            .dashboard-container {
              padding: 12px;
            }
            
            .charts-grid {
              grid-template-columns: 1fr;
            }
            
            .metrics-grid {
              grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            }
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;