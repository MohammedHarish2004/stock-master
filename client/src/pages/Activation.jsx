import { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const Activation = ({ onActivate }) => {
  const [key, setKey] = useState('');
  const [hardwareId, setHardwareId] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchHardwareId();
  }, []);

  const fetchHardwareId = async () => {
    try {
      const res = await fetch('/api/activation/status');
      const data = await res.json();
      if (data.hardwareId) {
        setHardwareId(data.hardwareId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(hardwareId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Hardware ID copied to clipboard');
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!key.trim()) return toast.error('Please enter an activation key');
    
    setLoading(true);
    try {
      const res = await fetch('/api/activation/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim() })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        onActivate();
      } else {
        toast.error(data.message || 'Invalid activation key');
      }
    } catch (error) {
      toast.error('Network error while activating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto w-16 h-16 bg-[#00868e]/10 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-[#00868e]" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Activate Stock Master
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 max-w">
          This software requires a one-time activation. Please send your Hardware ID to the vendor to receive your activation key.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Hardware ID
            </label>
            <div className="flex items-center">
              <input
                type="text"
                readOnly
                value={hardwareId || 'Loading...'}
                className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-l-xl bg-gray-50 text-gray-500 sm:text-sm focus:outline-none"
              />
              <button
                onClick={handleCopy}
                disabled={!hardwareId}
                className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-200 rounded-r-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors focus:outline-none"
              >
                {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <form onSubmit={handleActivate} className="space-y-6">
            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700">
                Activation Key
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="key"
                  name="key"
                  type="text"
                  required
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#00868e] focus:border-[#00868e] sm:text-sm transition-colors"
                  placeholder="Enter your activation key..."
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#00868e] hover:bg-[#00737a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00868e] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Activating...' : 'Activate Software'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Activation;
