import { useState, useEffect } from 'react';
import { Package, Hash, DollarSign, Truck, TrendingDown, ArrowRight, Download, Tags } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { socket } from '../socket';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    socket.on('product-updated', fetchStats);
    socket.on('sale-updated', fetchStats);
    
    return () => {
      socket.off('product-updated', fetchStats);
      socket.off('sale-updated', fetchStats);
    };
  }, []);

  const handleBackup = async () => {
    try {
      const res = await fetch('/api/backup');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.sqlite`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Database backup downloaded');
      } else {
        toast.error('Failed to backup database');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/sales/dashboard-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        toast.error('Failed to load dashboard stats');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00868e]"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Products', value: stats?.totalProducts || 0, icon: Package, color: 'text-blue-500', bg: 'bg-blue-100' },
    { title: 'Total Categories', value: stats?.totalCategory || 0, icon: Tags, color: 'text-purple-500', bg: 'bg-purple-100' },
    { title: "Today's Sales", value: `AED ${(stats?.todaySales || 0).toFixed(2)}`, icon: DollarSign, color: 'text-success', bg: 'bg-green-100' },
    { title: 'Delivered', value: stats?.pendingDeliveries || 0, icon: Truck, color: 'text-warning', bg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={handleBackup}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Backup Database
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4 transition-transform hover:-translate-y-1 duration-300">
            <div className={`p-4 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Sales */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Latest Sales</h3>
            <Link to="/sales-history" className="text-sm text-[#00868e] font-medium hover:underline flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="p-0">
            {stats?.latestSales?.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {stats.latestSales.map((sale) => (
                  <div key={sale.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-semibold text-gray-800">{sale.customerName || 'Walk-in Customer'}</h4>
                      <span className="font-bold text-gray-900">AED {sale.grandTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{sale.invoiceNo}</span>
                      <span>{new Date(sale.saleDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>No recent sales found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
              Low Stock Alerts
            </h3>
            <Link to="/products" className="text-sm text-[#00868e] font-medium hover:underline flex items-center">
              Manage Stock <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="p-0">
            {stats?.lowStockProducts?.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {stats.lowStockProducts.map((product) => (
                  <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-semibold text-gray-800">{product.productName}</h4>
                      <span className="font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full text-sm">
                        {product.stockQty} left
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{product.brand} • {product.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto text-green-300 mb-3" />
                <p>All products are well stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
