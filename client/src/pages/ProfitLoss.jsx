import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, BarChart3, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { socket } from '../socket';
import logo from '../assets/logo.png';

const ProfitLoss = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchReport();
    socket.on('sale-updated', fetchReport);
    return () => socket.off('sale-updated', fetchReport);
  }, []);

  const fetchReport = async (sDate, eDate) => {
    try {
      const params = new URLSearchParams();
      const s = sDate ?? startDate;
      const e = eDate ?? endDate;
      if (s) params.set('startDate', s);
      if (e) params.set('endDate', e);

      const res = await fetch(`/api/reports/profit-loss?${params}`);
      if (res.ok) {
        setReport(await res.json());
      } else {
        toast.error('Failed to load profit & loss report');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    setLoading(true);
    fetchReport();
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setLoading(true);
    fetchReport('', '');
  };

  // Quick presets
  const setPreset = (preset) => {
    const today = new Date();
    let s = '', e = '';
    const fmt = (d) => d.toISOString().split('T')[0];
    e = fmt(today);

    switch (preset) {
      case 'today':
        s = fmt(today);
        break;
      case '7days': {
        const d = new Date(today);
        d.setDate(d.getDate() - 7);
        s = fmt(d);
        break;
      }
      case '30days': {
        const d = new Date(today);
        d.setDate(d.getDate() - 30);
        s = fmt(d);
        break;
      }
      case 'thisMonth':
        s = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
        break;
      case 'thisYear':
        s = fmt(new Date(today.getFullYear(), 0, 1));
        break;
      default:
        break;
    }
    setStartDate(s);
    setEndDate(e);
    setLoading(true);
    fetchReport(s, e);
  };

  // ── Simple bar chart renderer (pure CSS, no library needed) ──
  const Bar = ({ label, value, maxValue, color = 'bg-[#00868e]', isNegative = false }) => {
    const pct = maxValue > 0 ? Math.min(Math.abs(value) / maxValue * 100, 100) : 0;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="w-32 text-sm text-gray-700 truncate font-medium" title={label}>{label}</span>
        <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isNegative ? 'bg-red-400' : color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`w-24 text-right text-sm font-bold tabular-nums ${isNegative ? 'text-red-600' : 'text-gray-900'}`}>
          ₹ {value.toFixed(2)}
        </span>
      </div>
    );
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'products', label: 'By Product' },
    { key: 'categories', label: 'By Category' },
    { key: 'trends', label: 'Trends' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <img src={logo} alt="Loading..." className="h-12 w-auto animate-pulse opacity-50" />
      </div>
    );
  }

  const s = report?.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-[#00868e]/10 p-2 rounded-xl">
            <BarChart3 className="text-[#00868e] w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Profit & Loss Report</h1>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e]"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e]"
            />
          </div>
          <button
            onClick={handleDateFilter}
            className="px-4 py-2 bg-[#00868e] text-white text-sm font-medium rounded-xl hover:bg-[#00737a] transition-colors"
          >
            Apply
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'today', label: 'Today' },
          { key: '7days', label: 'Last 7 Days' },
          { key: '30days', label: 'Last 30 Days' },
          { key: 'thisMonth', label: 'This Month' },
          { key: 'thisYear', label: 'This Year' },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-[#00868e]/5 hover:text-[#00868e] hover:border-[#00868e]/30 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard
          title="Total Revenue"
          value={`₹ ${s.revenue?.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          color="text-blue-600"
          bg="bg-blue-100"
        />
        <SummaryCard
          title="Cost of Goods"
          value={`₹ ${s.cogs?.toFixed(2) || '0.00'}`}
          icon={Package}
          color="text-orange-600"
          bg="bg-orange-100"
        />
        <SummaryCard
          title="Gross Profit"
          value={`₹ ${s.grossProfit?.toFixed(2) || '0.00'}`}
          icon={s.grossProfit >= 0 ? TrendingUp : TrendingDown}
          color={s.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}
          bg={s.grossProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}
        />
        <SummaryCard
          title="Profit Margin"
          value={`${s.profitMargin?.toFixed(1) || '0.0'}%`}
          icon={BarChart3}
          color={s.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}
          bg={s.profitMargin >= 0 ? 'bg-emerald-100' : 'bg-red-100'}
        />
        <SummaryCard
          title="Total Sales"
          value={s.totalSales || 0}
          icon={ShoppingCart}
          color="text-purple-600"
          bg="bg-purple-100"
        />
        <SummaryCard
          title="Items Sold"
          value={s.totalItemsSold || 0}
          icon={Package}
          color="text-cyan-600"
          bg="bg-cyan-100"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6 pt-4 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors ${
                activeTab === t.key
                  ? 'bg-[#00868e]/10 text-[#00868e] border-b-2 border-[#00868e]'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab report={report} Bar={Bar} />}
          {activeTab === 'products' && <ProductsTab data={report?.byProduct || []} />}
          {activeTab === 'categories' && <CategoriesTab data={report?.byCategory || []} Bar={Bar} />}
          {activeTab === 'trends' && <TrendsTab daily={report?.dailyTrend || []} monthly={report?.monthlyTrend || []} />}
        </div>
      </div>
    </div>
  );
};

// ── Summary Card ──
const SummaryCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center space-x-4 transition-transform hover:-translate-y-1 duration-300">
    <div className={`p-3 rounded-xl ${bg}`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 mb-0.5 truncate">{title}</p>
      <h3 className="text-lg font-bold text-gray-900 truncate">{value}</h3>
    </div>
  </div>
);

// ── Overview Tab ──
const OverviewTab = ({ report, Bar }) => {
  const top = report?.topProducts || [];
  const loss = report?.lossProducts || [];
  const maxTopVal = top.length > 0 ? Math.max(...top.map(p => Math.abs(p.profit))) : 0;
  const maxLossVal = loss.length > 0 ? Math.max(...loss.map(p => Math.abs(p.profit))) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Profitable */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
          <ArrowUpRight className="w-4 h-4 mr-1 text-green-500" />
          Top Profitable Products
        </h3>
        {top.length > 0 ? (
          <div className="space-y-1">
            {top.map((p, i) => (
              <Bar key={i} label={p.productName} value={p.profit} maxValue={maxTopVal} color="bg-green-500" />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No data available.</p>
        )}
      </div>

      {/* Loss Making */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
          <ArrowDownRight className="w-4 h-4 mr-1 text-red-500" />
          Loss-Making Products
        </h3>
        {loss.length > 0 ? (
          <div className="space-y-1">
            {loss.map((p, i) => (
              <Bar key={i} label={p.productName} value={p.profit} maxValue={maxLossVal} isNegative />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">All products are profitable!</span>
          </div>
        )}
      </div>

      {/* P&L Statement */}
      <div className="lg:col-span-2">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Profit & Loss Statement
        </h3>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-100">
              <PLRow label="Total Revenue (Sales)" value={report?.summary?.revenue} bold />
              <PLRow label="Less: Cost of Goods Sold (COGS)" value={-report?.summary?.cogs} negative />
              <PLRow label="Gross Profit / (Loss)" value={report?.summary?.grossProfit} bold highlight />
              <tr className="bg-gray-50">
                <td className="px-6 py-3 text-sm font-semibold text-gray-600">Profit Margin</td>
                <td className={`px-6 py-3 text-right text-sm font-bold ${
                  report?.summary?.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {report?.summary?.profitMargin?.toFixed(1) || '0.0'}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PLRow = ({ label, value = 0, bold, negative, highlight }) => (
  <tr className={highlight ? 'bg-gray-50' : ''}>
    <td className={`px-6 py-3 text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
      {label}
    </td>
    <td className={`px-6 py-3 text-right text-sm font-bold tabular-nums ${
      highlight
        ? (value >= 0 ? 'text-green-600' : 'text-red-600')
        : negative
          ? 'text-red-600'
          : 'text-gray-900'
    }`}>
      {negative ? `(₹ ${Math.abs(value).toFixed(2)})` : `₹ ${value?.toFixed(2) || '0.00'}`}
    </td>
  </tr>
);

// ── Products Tab ──
const ProductsTab = ({ data }) => {
  const [sortKey, setSortKey] = useState('profit');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const diff = (a[sortKey] || 0) - (b[sortKey] || 0);
      return sortDir === 'desc' ? -diff : diff;
    });
  }, [data, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortHeader = ({ label, field }) => (
    <th
      onClick={() => toggleSort(field)}
      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
    >
      {label} {sortKey === field && (sortDir === 'desc' ? '↓' : '↑')}
    </th>
  );

  if (data.length === 0) {
    return <p className="text-gray-400 text-center py-12">No product data available for the selected period.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50/80">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
            <SortHeader label="Qty Sold" field="qtySold" />
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost Price</th>
            <SortHeader label="Revenue" field="revenue" />
            <SortHeader label="Cost" field="cost" />
            <SortHeader label="Profit" field="profit" />
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Margin</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {sorted.map((p, i) => {
            const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100) : 0;
            return (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">{p.productName}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{p.qtySold}</td>
                <td className="px-6 py-3 text-sm text-gray-600">₹ {p.costPrice?.toFixed(2)}</td>
                <td className="px-6 py-3 text-sm text-gray-900 font-semibold">₹ {p.revenue?.toFixed(2)}</td>
                <td className="px-6 py-3 text-sm text-orange-600 font-semibold">₹ {p.cost?.toFixed(2)}</td>
                <td className={`px-6 py-3 text-sm font-bold ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹ {p.profit?.toFixed(2)}
                </td>
                <td className="px-6 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    margin >= 20 ? 'bg-green-100 text-green-700'
                    : margin >= 0 ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                  }`}>
                    {margin.toFixed(1)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-50 border-t-2 border-gray-200">
          <tr>
            <td className="px-6 py-3 text-sm font-bold text-gray-900">Total</td>
            <td className="px-6 py-3 text-sm font-bold text-gray-900">{data.reduce((a, b) => a + b.qtySold, 0)}</td>
            <td className="px-6 py-3"></td>
            <td className="px-6 py-3 text-sm font-bold text-gray-900">₹ {data.reduce((a, b) => a + b.revenue, 0).toFixed(2)}</td>
            <td className="px-6 py-3 text-sm font-bold text-orange-600">₹ {data.reduce((a, b) => a + b.cost, 0).toFixed(2)}</td>
            <td className={`px-6 py-3 text-sm font-bold ${
              data.reduce((a, b) => a + b.profit, 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ₹ {data.reduce((a, b) => a + b.profit, 0).toFixed(2)}
            </td>
            <td className="px-6 py-3"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ── Categories Tab ──
const CategoriesTab = ({ data, Bar }) => {
  const maxVal = data.length > 0 ? Math.max(...data.map(c => Math.abs(c.profit))) : 0;

  if (data.length === 0) {
    return <p className="text-gray-400 text-center py-12">No category data available for the selected period.</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Profit by Category</h3>
        <div className="space-y-1">
          {data.map((c, i) => (
            <Bar
              key={i}
              label={c.category || 'Uncategorized'}
              value={c.profit}
              maxValue={maxVal}
              color={c.profit >= 0 ? 'bg-[#00868e]' : 'bg-red-400'}
              isNegative={c.profit < 0}
            />
          ))}
        </div>
      </div>

      {/* Table */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Category Breakdown</h3>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Category</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.category || 'Uncategorized'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{c.qtySold}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">₹ {c.revenue?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-orange-600 text-right">₹ {c.cost?.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-sm text-right font-bold ${c.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹ {c.profit?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Trends Tab (pure CSS charts) ──
const TrendsTab = ({ daily, monthly }) => {
  const [view, setView] = useState('daily');
  const data = view === 'daily' ? daily : monthly;

  if (data.length === 0) {
    return <p className="text-gray-400 text-center py-12">No trend data available for the selected period.</p>;
  }

  const maxRev = Math.max(...data.map(d => d.revenue), 1);
  const maxProfit = Math.max(...data.map(d => Math.abs(d.profit)), 1);
  const chartHeight = 200;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          {view === 'daily' ? 'Daily' : 'Monthly'} Trends
        </h3>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView('daily')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              view === 'daily' ? 'bg-white text-[#00868e] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              view === 'monthly' ? 'bg-white text-[#00868e] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="mb-8">
        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Revenue vs Cost</h4>
        <div className="flex items-end gap-1 overflow-x-auto pb-2" style={{ minHeight: chartHeight + 40 }}>
          {data.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1 min-w-[40px]" title={`${d.date || d.month}\nRev: ₹${d.revenue?.toFixed(2)}\nCost: ₹${d.cost?.toFixed(2)}\nProfit: ₹${d.profit?.toFixed(2)}`}>
              <div className="flex items-end gap-0.5" style={{ height: chartHeight }}>
                <div
                  className="w-3 bg-blue-400 rounded-t-sm transition-all duration-300"
                  style={{ height: `${(d.revenue / maxRev) * chartHeight}px` }}
                />
                <div
                  className="w-3 bg-orange-400 rounded-t-sm transition-all duration-300"
                  style={{ height: `${(d.cost / maxRev) * chartHeight}px` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 -rotate-45 origin-top-left whitespace-nowrap mt-1">
                {view === 'daily'
                  ? new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                  : d.month}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" /> Revenue
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" /> Cost
          </span>
        </div>
      </div>

      {/* Profit Chart */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Profit / Loss</h4>
        <div className="flex items-end gap-1 overflow-x-auto pb-2" style={{ minHeight: chartHeight / 2 + 40 }}>
          {data.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1 min-w-[40px]" title={`${d.date || d.month}: ₹${d.profit?.toFixed(2)}`}>
              <div className="flex items-end" style={{ height: chartHeight / 2 }}>
                <div
                  className={`w-5 rounded-t-sm transition-all duration-300 ${d.profit >= 0 ? 'bg-green-400' : 'bg-red-400'}`}
                  style={{ height: `${(Math.abs(d.profit) / maxProfit) * (chartHeight / 2)}px` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 -rotate-45 origin-top-left whitespace-nowrap mt-1">
                {view === 'daily'
                  ? new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                  : d.month}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> Profit
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Loss
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="mt-8 border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{view === 'daily' ? 'Date' : 'Month'}</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Revenue</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Cost</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Profit</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((d, i) => {
              const margin = d.revenue > 0 ? ((d.profit / d.revenue) * 100) : 0;
              return (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    {view === 'daily'
                      ? new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : d.month}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 text-right font-semibold">₹ {d.revenue?.toFixed(2)}</td>
                  <td className="px-6 py-3 text-sm text-orange-600 text-right">₹ {d.cost?.toFixed(2)}</td>
                  <td className={`px-6 py-3 text-sm text-right font-bold ${d.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹ {d.profit?.toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-sm text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      margin >= 20 ? 'bg-green-100 text-green-700'
                      : margin >= 0 ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                      {margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td className="px-6 py-3 text-sm font-bold text-gray-900">Total</td>
              <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">₹ {data.reduce((a, b) => a + b.revenue, 0).toFixed(2)}</td>
              <td className="px-6 py-3 text-sm font-bold text-orange-600 text-right">₹ {data.reduce((a, b) => a + b.cost, 0).toFixed(2)}</td>
              <td className={`px-6 py-3 text-sm font-bold text-right ${
                data.reduce((a, b) => a + b.profit, 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹ {data.reduce((a, b) => a + b.profit, 0).toFixed(2)}
              </td>
              <td className="px-6 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ProfitLoss;

