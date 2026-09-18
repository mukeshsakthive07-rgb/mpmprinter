import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth, useAuth } from '../context/AuthContext';
import { UserProfile, PrintOrder } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestore-errors';
import { Search, Users, Activity, ShoppingCart, CheckCircle, Clock, X, ChevronRight, Phone, Mail, Calendar, FileText, Ban, Play } from 'lucide-react';

interface AdminUsersDashboardProps {
  orders: PrintOrder[];
}

export const AdminUsersDashboard: React.FC<AdminUsersDashboardProps> = ({ orders }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterHasOrders, setFilterHasOrders] = useState<'all' | 'yes' | 'no'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most-orders'>('newest');
  
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(fetched);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Enrich users with order data
  const enrichedUsers = useMemo(() => {
    return users.map(user => {
      const userOrders = orders.filter(o => o.userId === user.id);
      
      // Find a phone number from orders if not in profile
      let phone = user.phone;
      if (!phone || phone.trim() === '') {
        const orderWithPhone = userOrders.find(o => o.customerPhone && o.customerPhone.trim() !== '');
        if (orderWithPhone) {
          phone = orderWithPhone.customerPhone;
        }
      }

      const totalSpent = userOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      
      let lastOrderDate = '';
      if (userOrders.length > 0) {
        // Find latest order date
        const sortedUserOrders = [...userOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        lastOrderDate = sortedUserOrders[0].createdAt;
      }

      return {
        ...user,
        displayPhone: phone || 'No Phone',
        orderCount: userOrders.length,
        totalSpent,
        lastOrderDate,
        userOrders
      };
    });
  }, [users, orders]);

  // Statistics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive !== false).length;
    const usersWithOrders = enrichedUsers.filter(u => u.orderCount > 0).length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    
    return {
      totalUsers,
      activeUsers,
      usersWithOrders,
      totalOrders: orders.length,
      pendingOrders,
      completedOrders
    };
  }, [users, orders, enrichedUsers]);

  // Filtering and Sorting
  const filteredUsers = useMemo(() => {
    let result = enrichedUsers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        u.displayPhone.toLowerCase().includes(q)
      );
    }

    if (filterActive !== 'all') {
      result = result.filter(u => filterActive === 'active' ? u.isActive !== false : u.isActive === false);
    }

    if (filterHasOrders !== 'all') {
      result = result.filter(u => filterHasOrders === 'yes' ? u.orderCount > 0 : u.orderCount === 0);
    }

    result.sort((a, b) => {
      if (sortBy === 'most-orders') {
        return b.orderCount - a.orderCount;
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else {
        // newest
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return result;
  }, [enrichedUsers, searchQuery, filterActive, filterHasOrders, sortBy]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500 font-medium">Loading user data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} title="Total Users" value={stats.totalUsers} bg="bg-blue-50" border="border-blue-100" />
        <StatCard icon={<Activity className="w-5 h-5 text-emerald-600" />} title="Active Users" value={stats.activeUsers} bg="bg-emerald-50" border="border-emerald-100" />
        <StatCard icon={<ShoppingCart className="w-5 h-5 text-purple-600" />} title="Users w/ Orders" value={stats.usersWithOrders} bg="bg-purple-50" border="border-purple-100" />
        <StatCard icon={<FileText className="w-5 h-5 text-indigo-600" />} title="Total Orders" value={stats.totalOrders} bg="bg-indigo-50" border="border-indigo-100" />
        <StatCard icon={<Clock className="w-5 h-5 text-amber-600" />} title="Pending Orders" value={stats.pendingOrders} bg="bg-amber-50" border="border-amber-100" />
        <StatCard icon={<CheckCircle className="w-5 h-5 text-teal-600" />} title="Completed Orders" value={stats.completedOrders} bg="bg-teal-50" border="border-teal-100" />
      </div>

      {/* Filters and Search */}
      <div className="liquid-glass rounded-2xl p-4 text-white flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 liquid-glass-input rounded-xl text-sm transition-all"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select 
            value={filterActive} 
            onChange={e => setFilterActive(e.target.value as any)}
            className="px-3 py-2 liquid-glass-input rounded-xl text-sm transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select 
            value={filterHasOrders} 
            onChange={e => setFilterHasOrders(e.target.value as any)}
            className="px-3 py-2 liquid-glass-input rounded-xl text-sm transition-all"
          >
            <option value="all">All Users</option>
            <option value="yes">Has Orders</option>
            <option value="no">No Orders</option>
          </select>
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 liquid-glass-input rounded-xl text-sm transition-all"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most-orders">Most Orders</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="liquid-glass rounded-[28px] overflow-hidden text-white">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/15 text-slate-300 text-[11px] font-bold uppercase">
                <th className="p-4 pl-6">User</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Spent</th>
                <th className="p-4">Joined</th>
                <th className="p-4 pr-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No users found</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr 
                    key={user.id} 
                    onClick={() => setSelectedUser(user)}
                    className="hover:bg-white/5 border-b border-white/10 text-white cursor-pointer transition-colors group"
                  >
                    <td className="p-4 pl-6">
                      <div className="text-white font-bold text-sm transition-colors group-hover:text-cyan-400">{user.name}</div>
                      <div className="text-xs text-slate-400 capitalize">{user.role}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-[13px] text-white font-medium">{user.email}</div>
                      <div className="text-[12px] text-slate-300 font-medium mt-0.5">{user.displayPhone}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{user.orderCount}</div>
                      {user.lastOrderDate && <div className="text-[11px] text-slate-400">Last: {formatDate(user.lastOrderDate)}</div>}
                    </td>
                    <td className="p-4 font-bold text-emerald-400">
                      ₹{user.totalSpent.toFixed(2)}
                    </td>
                    <td className="p-4 text-[13px] text-white font-medium">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="p-4 pr-6">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        user.isActive !== false ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium">No users found</div>
          ) : (
            filteredUsers.map(user => (
              <div 
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="p-4 hover:bg-slate-50 cursor-pointer active:bg-slate-100 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-[15px]">{user.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{user.email}</span>
                  </div>
                  <div className="mt-2 flex gap-3 text-[11px] font-bold">
                    <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{user.orderCount} Orders</span>
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">₹{user.totalSpent.toFixed(2)}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          orders={selectedUser.userOrders}
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </div>
  );
};

// Extracted StatCard Component
const StatCard = ({ icon, title, value, bg, border }: { icon: React.ReactNode, title: string, value: number, bg: string, border: string }) => (
  <div className={`liquid-glass rounded-2xl p-4 flex flex-col justify-between text-white`}>
    <div className="flex items-center gap-2 mb-3">
      <div className={`p-2 rounded-xl ${bg}`}>{icon}</div>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
    </div>
    <div className="text-2xl font-black text-white tracking-tight">{value}</div>
  </div>
);

// User Details Modal Component
const UserDetailsModal = ({ user, orders, onClose }: { user: any, orders: PrintOrder[], onClose: () => void }) => {
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-white">{user.name}</h2>
            <p className="text-sm text-slate-500 font-medium">User Profile & History</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column: Info & Stats */}
            <div className="md:col-span-1 space-y-6">
              {/* Contact Info */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-4">Contact Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="break-all">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {user.displayPhone}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Order Stats */}
              <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-blue-600/70 mb-4">Account Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-bold text-blue-600/70 uppercase">Total Spent</div>
                    <div className="text-2xl font-black text-blue-900">₹{user.totalSpent.toFixed(2)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-200/50">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Total</div>
                      <div className="text-lg font-black text-white">{user.orderCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-amber-600 uppercase">Pending</div>
                      <div className="text-lg font-black text-amber-700">{pendingCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-emerald-400 uppercase">Completed</div>
                      <div className="text-lg font-black text-emerald-700">{completedCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-rose-600 uppercase">Cancelled</div>
                      <div className="text-lg font-black text-rose-700">{cancelledCount}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order History */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4">Complete Order History</h3>
              
              <div className="space-y-3">
                {orders.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-medium border border-dashed border-slate-300 rounded-2xl bg-slate-50">
                    This user has not placed any orders yet.
                  </div>
                ) : (
                  [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                    <div key={order.orderId} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            #{order.orderId.substring(0, 6)}
                          </span>
                          <span className="text-xs font-medium text-slate-400">{formatDate(order.createdAt)}</span>
                        </div>
                        
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                          order.status === 'cancelled' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                          order.status === 'printing' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          {order.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                           order.status === 'cancelled' ? <Ban className="w-3 h-3" /> :
                           order.status === 'printing' ? <Play className="w-3 h-3 fill-current" /> :
                           <Clock className="w-3 h-3" />}
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <div className="font-bold text-white">{order.serviceTitle}</div>
                        <div className="text-slate-500 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {order.files?.reduce((acc, f) => acc + (f.pageCount || 0), 0) || 0} pages
                        </div>
                        <div className="text-slate-500 flex items-center gap-1">
                          <span className="font-bold text-[10px] bg-slate-200 px-1 rounded text-slate-600">x{order.copies}</span> copies
                        </div>
                        <div className="font-black text-slate-900 ml-auto bg-slate-100 px-2 py-1 rounded-lg">
                          ₹{order.totalPrice}
                        </div>
                      </div>
                      
                      {order.deliveryAddress && order.deliveryAddress.trim() !== '' && (
                        <div className="mt-3 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-600">
                          <span className="font-bold">Delivery:</span> {order.deliveryAddress}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
