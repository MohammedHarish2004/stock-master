import { useState, useEffect } from 'react';
import { History, Search, FileText, X, Filter, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import { socket } from '../socket';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [jobNoSearch, setJobNoSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Invoice Modal
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  useEffect(() => {
    fetchSales();
    
    socket.on('sale-updated', fetchSales);
    return () => {
      socket.off('sale-updated', fetchSales);
    };
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSales();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [customerSearch, jobNoSearch, productSearch]);

  const fetchSales = async () => {
    try {
      const queryParams = new URLSearchParams({
        customer: customerSearch,
        jobNo: jobNoSearch,
        product: productSearch
      }).toString();

      const res = await fetch(`/api/sales?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      } else {
        toast.error('Failed to load sales history');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowConfirmDelete(true);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/sales/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Sale deleted and stock restored');
        setSales(sales.filter(s => s.id !== deleteId));
      } else {
        toast.error('Failed to delete sale');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setShowConfirmDelete(false);
      setDeleteId(null);
    }
  };

  const viewInvoice = async (id) => {
    setInvoiceLoading(true);
    try {
      const res = await fetch(`/api/sales/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedInvoice(data);
      } else {
        toast.error('Failed to load invoice details');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const filteredSales = sales.filter(s => {
    let matchesDate = true;
    if (dateFilter !== 'All') {
      const saleDate = new Date(s.saleDate);
      const today = new Date();
      if (dateFilter === 'Today') {
        matchesDate = saleDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'Last 7 Days') {
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        matchesDate = saleDate >= last7;
      } else if (dateFilter === 'This Month') {
        matchesDate = saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
      }
    }

    return matchesDate;
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const currentSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [customerSearch, jobNoSearch, productSearch, dateFilter]);

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-[#00868e]/10 p-2 rounded-xl">
            <History className="text-[#00868e] w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Sales History</h2>
        </div>
        
        <div className="w-full md:w-auto flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="block w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] sm:text-sm transition-colors appearance-none"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
          
          <div className="relative w-full sm:w-52">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] transition-colors sm:text-sm"
              placeholder="Customer or Phone..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-36">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] transition-colors sm:text-sm"
              placeholder="Job No..."
              value={jobNoSearch}
              onChange={(e) => setJobNoSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-40">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] transition-colors sm:text-sm"
              placeholder="Product..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
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
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium">No sales found.</p>
            <p className="text-sm">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice No</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grand Total</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentSales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-[#00868e] bg-[#00868e]/10 px-2 py-1 rounded-md text-sm inline-block">{s.invoiceNo}</div>
                      {s.jobNo && <div className="text-xs text-[#00868e] font-medium mt-1">Job: {s.jobNo}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.customerName || 'Walk-in'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Sale: {new Date(s.saleDate).toLocaleDateString()}</div>
                      {s.deliveryDate && <div>Del: {new Date(s.deliveryDate).toLocaleDateString()}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">AED {s.grandTotal.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => viewInvoice(s.id)} 
                          className="text-[#00868e] hover:text-blue-700 bg-[#00868e]/5 hover:bg-[#00868e]/10 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                          disabled={invoiceLoading}
                        >
                          View
                        </button>
                        <button 
                          onClick={() => confirmDelete(s.id)} 
                          className="text-danger hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                          title="Delete Sale"
                        >
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

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6 text-danger" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Delete Sale?</h3>
            <p className="text-sm text-center text-gray-500 mb-6">
              This will permanently delete the sale and restore the products to your inventory stock.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowConfirmDelete(false)}
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

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-[#00868e]" />
                Invoice <span className="ml-2 text-[#00868e]">{selectedInvoice.invoiceNo}</span>
              </h3>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:bg-gray-200 hover:text-gray-600 p-1 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Info</h4>
                  <div className="font-semibold text-gray-900 text-lg">{selectedInvoice.customerName || 'Walk-in'}</div>
                  {selectedInvoice.phone && <div className="text-gray-600">{selectedInvoice.phone}</div>}
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sale Details</h4>
                  {selectedInvoice.jobNo && <div className="text-gray-900 mb-1">Job No: <span className="font-medium text-[#00868e]">{selectedInvoice.jobNo}</span></div>}
                  <div className="text-gray-900">Sale Date: <span className="font-medium">{new Date(selectedInvoice.saleDate).toLocaleDateString()}</span></div>
                  {selectedInvoice.deliveryDate && <div className="text-gray-900">Delivery: <span className="font-medium">{new Date(selectedInvoice.deliveryDate).toLocaleDateString()}</span></div>}
                </div>
              </div>

              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Products</h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Product</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Price (AED)</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Total (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {selectedInvoice.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.productName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">{item.salePrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.qty}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="bg-gray-50 px-6 py-4 rounded-xl border border-gray-100 flex justify-between items-center w-72">
                  <span className="text-gray-600 font-bold uppercase text-sm tracking-wider">Grand Total</span>
                  <span className="text-xl font-bold text-[#00868e]">AED {selectedInvoice.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
