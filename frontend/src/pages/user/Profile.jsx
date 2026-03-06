import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { fetchMyAccount } from '../../store/slices/accountSlice';
import api from '../../services/api';
import { User, Mail, Phone, MapPin, Shield, Edit2, Check, X } from 'lucide-react';

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { account } = useSelector((state) => state.account);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', address: '', city: '', state: '',
  });

  useEffect(() => {
    dispatch(fetchMyAccount());
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
      });
    }
  }, [user, dispatch]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/users/profile/', form);
      setEditing(false);
    } catch (e) {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, icon: Icon, field, type = 'text' }) => (
    <div>
      <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
        <Icon size={12} /> {label}
      </label>
      {editing ? (
        <input
          type={type}
          value={form[field]}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          className="w-full bg-[#243044] border border-[#2d3d5a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
        />
      ) : (
        <p className="text-sm text-white py-2">{form[field] || <span className="text-gray-500">Not set</span>}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">My Profile</h1>

      {/* Avatar + Name */}
      <div className="bg-[#1a2235] rounded-2xl p-6 border border-[#243044] mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-2xl font-bold text-black">
          {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-semibold">
            {user?.first_name} {user?.last_name}
          </h2>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full mt-1 inline-block">
            ✓ Verified
          </span>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-[#1a2235] rounded-2xl p-6 border border-[#243044] mb-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-semibold flex items-center gap-2"><User size={16} /> Personal Information</h3>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-xs bg-yellow-500 text-black px-3 py-1.5 rounded-lg font-medium">
                <Check size={12} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs bg-[#243044] px-3 py-1.5 rounded-lg">
                <X size={12} /> Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs bg-[#243044] hover:bg-[#2d3d5a] px-3 py-1.5 rounded-lg transition">
              <Edit2 size={12} /> Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Field label="First Name" icon={User} field="first_name" />
          <Field label="Last Name" icon={User} field="last_name" />
          <Field label="Phone" icon={Phone} field="phone" type="tel" />
          <Field label="City" icon={MapPin} field="city" />
          <div className="col-span-2">
            <Field label="Address" icon={MapPin} field="address" />
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-[#1a2235] rounded-2xl p-6 border border-[#243044] mb-6">
        <h3 className="font-semibold flex items-center gap-2 mb-5"><Shield size={16} /> Account Details</h3>
        <div className="grid grid-cols-2 gap-5 text-sm">
          {[
            ['Account Number', account?.account_number],
            ['Account Type', account?.account_type?.toUpperCase()],
            ['UPI ID', account?.upi_id],
            ['IFSC Code', account?.ifsc_code],
            ['Branch', account?.branch],
            ['Status', account?.status],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="font-mono text-yellow-300">{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-[#1a2235] rounded-2xl p-6 border border-[#243044]">
        <h3 className="font-semibold flex items-center gap-2 mb-4"><Shield size={16} /> Security</h3>
        <div className="space-y-3">
          {[
            { label: 'Change Password', desc: 'Update your account password' },
            { label: 'Two-Factor Auth', desc: 'Add extra security with OTP' },
            { label: 'Active Sessions', desc: 'Manage logged-in devices' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex justify-between items-center py-3 border-b border-[#243044] last:border-0">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <button className="text-xs text-yellow-400 hover:underline">Manage →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}