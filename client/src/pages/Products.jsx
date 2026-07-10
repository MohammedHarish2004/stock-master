import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Package, PlusCircle, Filter, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import { socket } from '../socket';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockSort, setStockSort] = useState('Default');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // For Delete Confirmation
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // For Add Stock
  const [showAddStock, setShowAddStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addStockAmount, setAddStockAmount] = useState('');

  // For Edit Price
  const [showEditPrice, setShowEditPrice] = useState(false);
  const [editCost, setEditCost] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // For View Sales
  const [showSales, setShowSales] = useState(false);
  const [productSales, setProductSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);

  // For Full Edit
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {});
    
    socket.on('product-updated', fetchProducts);
    return () => {
      socket.off('product-updated', fetchProducts);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        toast.error('Failed to load products');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const handleAddStock = async () => {
    if (!addStockAmount || isNaN(addStockAmount) || parseInt(addStockAmount) <= 0) {
      toast.error('Please enter a valid stock amount');
      return;
    }
    try {
      const newStock = selectedProduct.stockQty + parseInt(addStockAmount);
      const updatedProduct = { ...selectedProduct, stockQty: newStock };
      
      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });
      
      if (res.ok) {
        toast.success('Stock added successfully');
        setProducts(products.map(p => p.id === selectedProduct.id ? updatedProduct : p));
        setShowAddStock(false);
        setAddStockAmount('');
        setSelectedProduct(null);
      } else {
        toast.error('Failed to add stock');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleEditPrice = async () => {
    if (!editCost || isNaN(editCost) || !editPrice || isNaN(editPrice)) {
      toast.error('Please enter valid prices');
      return;
    }
    try {
      const updatedProduct = { 
        ...selectedProduct, 
        costPrice: parseFloat(editCost), 
        defaultSellingPrice: parseFloat(editPrice) 
      };
      
      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });
      
      if (res.ok) {
        toast.success('Prices updated successfully');
        setProducts(products.map(p => p.id === selectedProduct.id ? updatedProduct : p));
        setShowEditPrice(false);
        setEditCost('');
        setEditPrice('');
        setSelectedProduct(null);
      } else {
        toast.error('Failed to update prices');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/products/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Product deleted');
        setProducts(products.filter(p => p.id !== deleteId));
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setShowConfirm(false);
      setDeleteId(null);
    }
  };

  const viewSales = async (product) => {
    setSelectedProduct(product);
    setShowSales(true);
    setSalesLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/sales`);
      const data = await res.json();
      setProductSales(data);
    } catch (error) {
      toast.error('Failed to load sales data');
    } finally {
      setSalesLoading(false);
    }
  };

  const openEditProduct = (product) => {
    setSelectedProduct(product);
    setEditForm({
      productName: product.productName,
      category: product.category,
      brand: product.brand,
      costPrice: product.costPrice,
      defaultSellingPrice: product.defaultSellingPrice,
      stockQty: product.stockQty
    });
    setShowEditProduct(true);
  };

  const handleEditProduct = async () => {
    if (!editForm.productName || !editForm.category || !editForm.brand) {
      toast.error('Name, category, and brand are required');
      return;
    }
    try {
      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        toast.success('Product updated successfully');
        setShowEditProduct(false);
        setSelectedProduct(null);
      } else {
        toast.error('Failed to update product');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const categoryOptions = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.productName.toLowerCase().includes(search.toLowerCase()) ||
                          p.brand.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (stockSort === 'HighToLow') return b.stockQty - a.stockQty;
    if (stockSort === 'LowToHigh') return a.stockQty - b.stockQty;
    return 0; // Default
  });

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const currentProducts = sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, stockSort]);

  const getRowStyle = (stock) => {
    if (stock === 0) return 'bg-red-50 hover:bg-red-100';
    if (stock < 4) return 'bg-orange-50 hover:bg-orange-100';
    return 'hover:bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-[#00868e]/10 p-2 rounded-xl">
            <Package className="text-[#00868e] w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Inventory Management</h2>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <div className="text-md font-bold flex items-center">
          Total Products : {filteredProducts.length}
        </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="block w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-colors appearance-none"
            >
              {categoryOptions.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={stockSort}
              onChange={(e) => setStockSort(e.target.value)}
              className="block w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-colors appearance-none"
            >
              <option value="Default">Sort Stock</option>
              <option value="HighToLow">Stock: High to Low</option>
              <option value="LowToHigh">Stock: Low to High</option>
            </select>
          </div>
          
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-colors"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium">No products found.</p>
            <p className="text-sm">Try adjusting your search or add a new product in Stock In.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost (AED)</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (AED)</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentProducts.map((p) => (
                  <tr key={p.id} className={`transition-colors ${getRowStyle(p.stockQty)}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{p.productName}</div>
                      <div className="text-xs text-gray-500">{p.brand}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.costPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.defaultSellingPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                        p.stockQty === 0 ? 'bg-red-200 text-red-800' : p.stockQty < 4 ? 'bg-orange-200 text-orange-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {p.stockQty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => viewSales(p)}
                          title="View Sales"
                          className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedProduct(p);
                            setAddStockAmount('');
                            setShowAddStock(true);
                          }} 
                          title="Add Stock"
                          className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors"
                        >
                          <PlusCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => openEditProduct(p)}
                          title="Edit Product"
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => confirmDelete(p.id)} title="Delete" className="text-danger hover:bg-red-50 p-2 rounded-lg transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage} 
              />
            )}
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {showAddStock && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Stock: {selectedProduct?.productName}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Amount to Add</label>
              <input
                type="number"
                min="1"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={addStockAmount}
                onChange={(e) => setAddStockAmount(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowAddStock(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddStock}
                className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales View Modal */}
      {showSales && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedProduct?.productName} Sales</h3>
                <p className="text-sm text-gray-500">History of sales for this product</p>
              </div>
              <button onClick={() => setShowSales(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {salesLoading ? (
                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : productSales.length === 0 ? (
                <p className="text-center text-gray-500 p-8">No sales found for this product.</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice/Job</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {productSales.map((sale, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{new Date(sale.saleDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          <div>{sale.invoiceNo}</div>
                          {sale.jobNo && <div className="text-xs text-indigo-600 font-medium">Job: {sale.jobNo}</div>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{sale.customerName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">{sale.qty}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-gray-900">{sale.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowSales(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Edit Product Modal */}
      {showEditProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900">Edit Product</h3>
              <button onClick={() => setShowEditProduct(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input type="text" value={editForm.productName || ''} onChange={e => setEditForm(f => ({...f, productName: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={editForm.category || ''} onChange={e => setEditForm(f => ({...f, category: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none">
                  <option value="" disabled>Select category</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input type="text" value={editForm.brand || ''} onChange={e => setEditForm(f => ({...f, brand: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (AED)</label>
                <input type="number" step="0.01" min="0" value={editForm.costPrice || ''} onChange={e => setEditForm(f => ({...f, costPrice: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (AED)</label>
                <input type="number" step="0.01" min="0" value={editForm.defaultSellingPrice || ''} onChange={e => setEditForm(f => ({...f, defaultSellingPrice: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty</label>
                <input type="number" min="0" value={editForm.stockQty || ''} onChange={e => setEditForm(f => ({...f, stockQty: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowEditProduct(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleEditProduct} className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Price Modal (kept for legacy, now unused) */}
      {showEditPrice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Prices: {selectedProduct?.productName}</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowEditPrice(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditPrice}
                className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6 text-danger" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Delete Product?</h3>
            <p className="text-sm text-center text-gray-500 mb-6">
              This action cannot be undone. This will permanently delete the product from the inventory.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-danger text-white font-medium rounded-xl hover:bg-red-600 transition-colors shadow-sm shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
