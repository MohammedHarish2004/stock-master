import { useState, useEffect } from 'react';
import { PackagePlus, Save, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const StockIn = () => {
  const initialState = {
    productName: '',
    category: '',
    brand: '',
    costPrice: '',
    defaultSellingPrice: '',
    stockQty: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFormData(initialState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (formData.costPrice < 0 || formData.defaultSellingPrice < 0) {
      toast.error('Prices cannot be negative');
      return;
    }
    if (formData.stockQty <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Product saved successfully');
        handleClear();
      } else {
        toast.error(data.message || 'Failed to save product');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Get unique lists for autocomplete
  const uniqueProductNames = [...new Set(products.map(p => p.productName).filter(Boolean))];
  const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#00868e]/5 p-6 border-b border-gray-100 flex items-center space-x-3">
          <div className="bg-[#00868e] p-2 rounded-xl">
            <PackagePlus className="text-white w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Stock In</h2>
            <p className="text-sm text-gray-500">Add new products. Same name + same category will add to existing stock.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
              <input
                type="text"
                name="productName"
                required
                value={formData.productName}
                list='recentproducts'
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] transition-colors focus:bg-white outline-none"
                placeholder="e.g. iPhone 15 Pro Max"
              />
              <datalist id="recentproducts">
                {uniqueProductNames.map((name, idx) => (
                  <option key={idx} value={name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] transition-colors focus:bg-white outline-none appearance-none"
              >
                <option value="" disabled>Select a category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <input
                type="text"
                name="brand"
                required
                list='recentbrand'
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] transition-colors focus:bg-white outline-none"
                placeholder="e.g. Apple"
              />
              <datalist id="recentbrand">
                {uniqueBrands.map((brand, idx) => (
                  <option key={idx} value={brand} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price (AED)</label>
              <input
                type="number"
                name="costPrice"
                required
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors focus:bg-white outline-none"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Selling Price (AED)</label>
              <input
                type="number"
                name="defaultSellingPrice"
                required
                step="0.01"
                min="0"
                value={formData.defaultSellingPrice}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] transition-colors focus:bg-white outline-none"
                placeholder="0.00"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity (to add)</label>
              <input
                type="number"
                name="stockQty"
                required
                min="1"
                value={formData.stockQty}
                onChange={handleChange}
                className="w-full md:w-1/2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors focus:bg-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
              <p className="mt-2 text-xs text-gray-500">Same product name + same category → adds to stock. Different category → creates a new product.</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 md:flex-none flex items-center justify-center px-8 py-3.5 bg-[#00868e] text-white font-medium rounded-xl shadow-md hover:bg-[#00868e]/80 focus:ring-2 focus:ring-offset-2 focus:ring-[#00868e]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Product'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={isSaving}
              className="flex-1 md:flex-none flex items-center justify-center px-8 py-3.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockIn;
