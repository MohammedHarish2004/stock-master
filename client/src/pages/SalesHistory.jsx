import { useState, useEffect } from 'react';
import { History, Search, FileText, X, Filter, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import { socket } from '../socket';
import logo from '../assets/logo.png';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Invoice Modal
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [company, setCompany] = useState({});

  useEffect(() => {
    fetchSales();
    fetchCompany();

    socket.on('sale-updated', fetchSales);
    return () => {
      socket.off('sale-updated', fetchSales);
    };
  }, []);

  const fetchCompany = async () => {
    try {
      const res = await fetch('/api/company');
      if (res.ok) {
        const data = await res.json();
        setCompany(data);
      }
    } catch (error) {
      console.error('Failed to load company info');
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSales();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [customerSearch, invoiceSearch, productSearch]);

  const fetchSales = async () => {
    try {
      const queryParams = new URLSearchParams({
        customer: customerSearch,
        invoiceNo: invoiceSearch,
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

  const handleThermalPrint = () => {
    const d = new Date(selectedInvoice.saleDate).toLocaleString();

    const itemsHtml = selectedInvoice.items?.map(item => `
      <li style="margin-bottom: 8px; list-style: none; border-bottom: 0.5px solid #eee; padding-bottom: 5px;">
        <div class="row">
          <span class="bold">${item.productName}</span>
          <span class="bold">₹ ${item.salePrice.toFixed(2)}</span>
        </div>
        <div class="row semibold">
          <span>Qty: ${item.qty}</span>
          <span>Total: ₹ ${item.total.toFixed(2)}</span>
        </div>
      </li>
    `).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Thermal Receipt</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0 !important;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              width: 72mm;
              font-family: Arial, sans-serif;
              font-size: 12px;
              padding: 0 4mm 5mm 4mm;
              color: #000;
              line-height: 1.2;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .semibold { font-weight: 500; }
            .divider {
              border-top: 1px dashed #000;
              margin: 5px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin: 2px 0;
            }
            .row span:first-child {
              width: 50%;
              text-align: left;
              overflow-wrap: break-word;
            }
            .row span:last-child {
              width: 50%;
              text-align: right;
              white-space: nowrap;
            }
            ul {
              padding: 0;
              margin: 4px 0;
              list-style: none;
            }
            .header {
              font-size: 14px;
              margin-top: 0;
              margin-bottom: 2px;
              padding-top: 2mm;
            }
            .footer {
              font-size: 11px;
              margin-top: 8px;
              padding-bottom: 30px;
            }
          </style>
        </head>
        <body>
          <div class="center bold header">${company.name || 'Your Company Name'}</div>
          <div class="center" style="font-size: 11px;">${company.address || 'Company Address'}</div>
          <div class="center" style="font-size: 11px;">Mob: ${company.phone || '-'}</div>

          <div class="divider"></div>

          <div class="center bold" style="font-size: 15px; margin: 4px 0;">INVOICE</div>
          <div class="divider"></div>

          <div class="row">
            <span>Invoice No:</span>
            <span class="bold">#${selectedInvoice.invoiceNo}</span>
          </div>
          <div class="row">
            <span>Date:</span>
            <span>${d}</span>
          </div>
          <div class="row">
            <span>Customer:</span>
            <span class="bold">${selectedInvoice.customerName || 'Walk-in'}</span>
          </div>
          ${selectedInvoice.phone ? `
          <div class="row">
            <span>Phone:</span>
            <span class="bold">${selectedInvoice.phone}</span>
          </div>` : ''}

          <div class="divider"></div>

          <div class="bold">Items:</div>
          <ul>${itemsHtml}</ul>

          <div class="divider"></div>

          <div class="row bold" style="font-size: 14px; padding-top: 3px;">
            <span>Grand Total:</span>
            <span>₹ ${selectedInvoice.grandTotal.toFixed(2)}</span>
          </div>

          <div class="divider"></div>
          
          <div class="center footer">
            Thank you for your business!
            <br>
            <div style="height: 30px;"></div>
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(printContent);
    iframe.contentWindow.document.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
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
  }, [customerSearch, invoiceSearch, productSearch, dateFilter]);

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 items-center">

          {/* Title */}
          <div className="xl:col-span-2 flex items-center gap-3">
            <div className="bg-[#00868e]/10 p-2 rounded-xl">
              <History className="text-[#00868e] w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Sales History</h2>
          </div>

          {/* Total Sales */}
          <div className="col-span-full xl:col-span-2">
            <span className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold">
              Sales : {filteredSales.length}
            </span>
          </div>

          {/* Date Filter */}
          <div className="col-span-full xl:col-span-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] appearance-none"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
          </div>

          {/* Customer Search */}
          <div className="col-span-full xl:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Customer / Phone..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e]"
            />
          </div>
          </div>

          {/* Invoice Search */}
          <div className="col-span-full xl:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Invoice No..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e]"
            />
          </div>
          </div>

          {/* Product Search */}
          <div className="col-span-full xl:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Product..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e]"
            />
          </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <img src={logo} alt="Loading..." className="h-12 w-auto animate-pulse" />
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-xl font-medium">No sales found.</p>
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.customerName || 'Walk-in'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Sale: {new Date(s.saleDate).toLocaleDateString()}</div>
                      {s.deliveryDate && <div>Del: {new Date(s.deliveryDate).toLocaleDateString()}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹ {s.grandTotal.toFixed(2)}</td>
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
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Price (₹)</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Total (₹)</th>
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
                  <span className="text-xl font-bold text-[#00868e]">₹ {selectedInvoice.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={handleThermalPrint}
                className="px-6 py-2 bg-[#00868e] text-white font-medium rounded-lg hover:bg-[#00737a] transition-colors flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Print Bill
              </button>
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
