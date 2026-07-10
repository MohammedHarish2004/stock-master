import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, PlusCircle, Package, ShoppingCart, History, LogOut, Store, Tags } from 'lucide-react';
import logo from '../assets/CD Logo2.png'

const MainLayout = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/stock-in': return 'Stock In';
      case '/products': return 'Products';
      case '/sales': return 'Sales';
      case '/sales-history': return 'Sales History';
      case '/categories': return 'Categories';
      default: return 'Dashboard';
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Stock In', path: '/stock-in', icon: PlusCircle },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Sales', path: '/sales', icon: ShoppingCart },
    { name: 'Sales History', path: '/sales-history', icon: History },
    { name: 'Categories', path: '/categories', icon: Tags },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col justify-between">
        <div>
          <div className="p-6 flex items-center space-x-3">
            <img src={logo} alt="" />
          </div>
          <nav className="mt-6 px-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[#00868e]/10 text-[#00868e] font-medium'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-danger hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex justify-between items-center z-10 sticky top-0">
          <h2 className="text-2xl font-semibold text-gray-800">{getPageTitle()}</h2>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-sm font-medium text-gray-600">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
