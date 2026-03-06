import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboard } from '../../store/slices/accountSlice';
import { Eye, EyeOff, Copy, Check, RefreshCw, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { dashboard, loading, error } = useSelector((state) => state.account);
  const { user } = useSelector((state) => state.auth);

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0d1117]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-yellow-400"></div>
    </div>
  );

  const account = dashboard?.account;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-semibold">
            {getGreeting()}, {user?.first_name || user?.username} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Here's your financial overview</p>
        </div>
        <button
          onClick={() => dispatch(fetchDashboard())}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a2235] rounded-lg hover:bg-[#243044] transition text-sm"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
          {typeof error === 'string' ? error : 'Failed to load account data. Please refresh.'}
        </div>
      )}

      {/* Account Card */}
      <div className="bg-gradient-to-br from-[#1a2a4a] to-[#0d1a35] rounded-2xl p-6 mb-6 border border-[#243044]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
              {account?.account_type?.toUpperCase() || 'SAVINGS'} ACCOUNT
            </p>
            <div className="flex items-center gap-2">
              <span className="text-gray-300 font-mono text-sm">
                {account?.account_number
                  ? account.account_number.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')
                  : '---- ---- ----'}
              </span>
              {account?.account_number && (
                <button onClick={() => copyToClipboard(account.account_number, 'account')}>
                  {copied === 'account' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-500 hover:text-white" />}
                </button>
              )}
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${account?.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
            {account?.status || 'Active'}
          </span>
        </div>

        {/* Balance */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-1">Available Balance</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">
              {balanceVisible ? formatCurrency(account?.balance) : '₹ ••••••'}
            </span>
            <button onClick={() => setBalanceVisible(!balanceVisible)}>
              {balanceVisible ? <EyeOff size={18} className="text-gray-500" /> : <Eye size={18} className="text-gray-500" />}
            </button>
          </div>
        </div>

        {/* UPI + IFSC */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-400 mb-1">UPI ID</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-yellow-400">
                {account?.upi_id || 'Not assigned'}
              </span>
              {account?.upi_id && (
                <button onClick={() => copyToClipboard(account.upi_id, 'upi')}>
                  {copied === 'upi' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-500 hover:text-white" />}
                </button>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">IFSC Code</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">{account?.ifsc_code || 'ANDB0000001'}</span>
              <button onClick={() => copyToClipboard(account?.ifsc_code || 'ANDB0000001', 'ifsc')}>
                {copied === 'ifsc' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-500 hover:text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {['Send', 'Receive', 'History'].map((action) => (
            <button
              key={action}
              className="flex-1 py-2 rounded-xl bg-[#243044] hover:bg-[#2d3d5a] transition text-sm font-medium"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'TOTAL IN', value: formatCurrency(dashboard?.total_in), sub: 'This month', icon: ArrowDownLeft, color: 'text-green-400', bg: 'bg-green-900/20' },
          { label: 'TOTAL OUT', value: formatCurrency(dashboard?.total_out), sub: 'This month', icon: ArrowUpRight, color: 'text-red-400', bg: 'bg-red-900/20' },
          { label: 'TRANSACTIONS', value: dashboard?.transaction_count ?? 0, sub: 'Recent', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-900/20' },
          { label: 'UPI PAYMENTS', value: dashboard?.upi_count ?? 0, sub: 'Recent', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#1a2235] rounded-xl p-4 border border-[#243044]">
            <div className="flex justify-between items-start mb-3">
              <p className="text-xs text-gray-400 tracking-widest">{label}</p>
              <span className={`${bg} ${color} p-1.5 rounded-lg`}><Icon size={14} /></span>
            </div>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-[#1a2235] rounded-2xl p-6 border border-[#243044]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Recent Transactions</h2>
          <button className="text-yellow-400 text-sm hover:underline">View All →</button>
        </div>

        {dashboard?.recent_transactions?.length > 0 ? (
          <div className="space-y-3">
            {dashboard.recent_transactions.map((txn) => (
              <div key={txn.id} className="flex justify-between items-center py-3 border-b border-[#243044] last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${txn.type === 'credit' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                    {txn.type === 'credit'
                      ? <ArrowDownLeft size={16} className="text-green-400" />
                      : <ArrowUpRight size={16} className="text-red-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{txn.description || 'Transaction'}</p>
                    <p className="text-xs text-gray-400">{formatDate(txn.created_at)}</p>
                  </div>
                </div>
                <span className={`font-semibold text-sm ${txn.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                  {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p className="text-3xl mb-2">⇌</p>
            <p>No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}