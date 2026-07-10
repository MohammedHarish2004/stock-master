import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, Search, Check, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { socket } from '../socket';

const Sales = () => {
  const [products, setProducts] = useState([]);
  
  // Customer Details
  const [customerDetails, setCustomerDetails] = useState({
    customerName: '',
    phone: '',
    jobNo: '',
    deliveryDate: new Date().toISOString().split('T')[0], // Default today
  });

  // Product Selection
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [salePrice, setSalePrice] = useState('');
  const [qty, setQty] = useState(1);

  // Cart
  const [cart, setCart] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
    
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
        // Only keep products with stock > 0 for selling
        setProducts(data.filter(p => p.stockQty > 0));
      }
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({ ...prev, [name]: value }));
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setSalePrice(product.defaultSellingPrice);
    setQty(1);
    setSearch('');
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    
    // Validations
    if (salePrice < 0) {
      toast.error('Sale price cannot be negative');
      return;
    }
    if (qty <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    // Check against available stock (including items already in cart)
    const existingCartItem = cart.find(item => item.productId === selectedProduct.id);
    const qtyInCart = existingCartItem ? existingCartItem.qty : 0;
    const totalQtyRequested = Number(qty) + qtyInCart;

    if (totalQtyRequested > selectedProduct.stockQty) {
      toast.error(`Cannot sell more than available stock (${selectedProduct.stockQty})`);
      return;
    }

    const newItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.productName,
      salePrice: Number(salePrice),
      qty: Number(qty),
      total: Number(salePrice) * Number(qty)
    };

    if (existingCartItem) {
      // Update existing
      setCart(cart.map(item => 
        item.productId === selectedProduct.id 
          ? { ...item, qty: item.qty + newItem.qty, total: item.total + newItem.total }
          : item
      ));
    } else {
      // Add new
      setCart([...cart, newItem]);
    }

    // Reset selection
    setSelectedProduct(null);
    setSalePrice('');
    setQty(1);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);

  const handleSaveSale = async () => {
    if (cart.length === 0) {
      toast.error('Add at least one product to the cart');
      return;
    }

    if (!customerDetails.customerName) {
      toast.error('Customer Name is required');
      return;
    }

    if (!customerDetails.jobNo) {
      toast.error('Job Number is required');
      return;
    }

    setIsSaving(true);
    try {
      const saleData = {
        ...customerDetails,
        items: cart,
        grandTotal
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(`Sale completed! Invoice: ${data.invoiceNo}`);
        // Clear form
        setCustomerDetails({
          customerName: '',
          phone: '',
          jobNo: '',
          deliveryDate: new Date().toISOString().split('T')[0]
        });
        setCart([]);
        fetchProducts(); // Refresh stock
      } else {
        toast.error(data.message || 'Failed to save sale');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSearchProducts = search 
    ? products.filter(p => p.productName.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Customer & Product Selection */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Customer Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-[#00868e]/10 w-8 h-8 rounded-lg flex items-center justify-center mr-2 text-[#00868e] font-bold">1</span>
            Customer Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                name="customerName"
                value={customerDetails.customerName}
                onChange={handleCustomerChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] transition-colors outline-none"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
              <input
                type="text"
                name="phone"
                value={customerDetails.phone}
                onChange={handleCustomerChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] transition-colors outline-none"
                placeholder="Phone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job No *</label>
              <input
                type="text"
                name="jobNo"
                required
                value={customerDetails.jobNo}
                onChange={handleCustomerChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] transition-colors outline-none"
                placeholder="Job No"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
              <input
                type="date"
                name="deliveryDate"
                value={customerDetails.deliveryDate}
                onChange={handleCustomerChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] transition-colors outline-none"
              />
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-visible">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-[#00868e]/10 w-8 h-8 rounded-lg flex items-center justify-center mr-2 text-[#00868e] font-bold">2</span>
            Add Products
          </h3>
          
          {/* Search */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] transition-colors"
              placeholder="Search product by name to add..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* Search Results Dropdown */}
            {search && (
              <div className="absolute z-20 w-full mt-1 bg-white shadow-xl rounded-xl border border-gray-100 max-h-60 overflow-y-auto">
                {filteredSearchProducts.length > 0 ? (
                  filteredSearchProducts.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => selectProduct(p)}
                      className="p-3 hover:bg-[#00868e]/5 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{p.productName}</div>
                        <div className="text-xs text-gray-500">{p.brand} • {p.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">AED {p.defaultSellingPrice}</div>
                        <div className={`text-xs font-bold ${p.stockQty <= 5 ? 'text-warning' : 'text-success'}`}>{p.stockQty} in stock</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">No products found</div>
                )}
              </div>
            )}
          </div>

          {/* Selected Product Form */}
          {selectedProduct && (
            <div className="bg-[#00868e]/5 rounded-xl border border-[#00868e]/100 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-gray-900">{selectedProduct.productName}</h4>
                  <p className="text-sm text-gray-500">Available Stock: <span className="font-bold text-[#00868e]">{selectedProduct.stockQty}</span></p>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-600">×</button>
              </div>
              
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sale Price (AED)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] transition-colors outline-none font-medium"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct.stockQty}
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] transition-colors outline-none font-medium text-center"
                  />
                </div>
                <div className="w-28 text-right bg-white p-2 rounded-lg border border-gray-100 hidden sm:block">
                  <div className="text-xs font-medium text-gray-500">Total</div>
                  <div className="font-bold text-gray-900">AED {(Number(salePrice) * Number(qty) || 0).toFixed(2)}</div>
                </div>
                <button 
                  onClick={addToCart}
                  className="bg-[#00868e] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#00868e]/80 transition-colors flex items-center shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Cart & Summary */}
      <div className="lg:col-span-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full sticky top-24">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-[#00868e]" />
              Current Sale
            </h3>
            <span className="bg-[#00868e]/10 text-[#00868e] px-2.5 py-0.5 rounded-full text-sm font-bold">{cart.length} Items</span>
          </div>

          <div className="flex-1 p-0 overflow-y-auto min-h-[300px]">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                <ShoppingCart className="w-12 h-12 mb-3 text-gray-200" />
                <p>No products added yet.</p>
                <p className="text-sm mt-1">Search and select a product to begin.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {cart.map((item, index) => (
                  <li key={index} className="p-4 hover:bg-gray-50 transition-colors group">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <h4 className="font-medium text-gray-900 text-sm">{item.productName}</h4>
                        <div className="text-xs text-gray-500 mt-1">
                          AED {item.salePrice} × {item.qty}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 text-sm">AED {item.total.toFixed(2)}</div>
                        <button 
                          onClick={() => removeFromCart(index)}
                          className="text-gray-300 hover:text-danger mt-1 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4 ml-auto" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-600 font-medium">Grand Total</span>
              <span className="text-3xl font-bold text-gray-900">AED {grandTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={handleSaveSale}
              disabled={isSaving || cart.length === 0}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-md text-lg font-bold text-white bg-success hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Check className="w-6 h-6 mr-2" />
              )}
              {isSaving ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Sales;
