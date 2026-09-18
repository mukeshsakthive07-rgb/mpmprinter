import React, { useEffect, useState } from 'react';
import { useAuth, db, auth } from '../context/AuthContext';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestore-errors';
import { PrintOrder } from '../types';
import { Phone, Play, Hourglass, Trash2, RefreshCw, Ban, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdminUsersDashboard } from './AdminUsersDashboard';

export const ReceiverPanel: React.FC = () => {
  const { firebaseUser, user } = useAuth();
  const { showToast, deleteOrder } = useApp();
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'users'>('active');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: any = null;

    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    const verifyAndLoad = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch('/api/admin/verify', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
          if (isMounted) setLoading(false);
          return;
        }
        
        if (!isMounted) return;

        const q = query(collection(db, 'orders'));
        unsubscribe = onSnapshot(q, (snapshot) => {
          if (!isMounted) return;
          const fetched = snapshot.docs.map(doc => ({ orderId: doc.id, ...doc.data() } as PrintOrder));
          setOrders(fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          setLoading(false);
        }, (error) => {
          console.error("Error fetching orders:", error);
          if (isMounted) setLoading(false);
        });
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    };

    verifyAndLoad();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseUser]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      if (status === 'completed') {
        showToast(`Order #${orderId} marked as completed!`, 'success');
      } else if (status === 'cancelled') {
        showToast(`Order #${orderId} was cancelled.`, 'info');
      }
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (orderId: string) => {
    try {
      const res = await deleteOrder(orderId);
      if (!res.success) { throw new Error(res.error); }
    } catch (e) {
      console.error(e); showToast('Failed to delete order', 'error');
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const time = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
    return `${day} ${month}, ${time}`;
  };

  if (loading) return <div className="text-center py-20 text-slate-500 font-medium">Loading shop panel...</div>;
  if (user?.role !== 'admin') return <div className="text-center py-20 text-rose-500 font-bold">Access Denied</div>;

  const filteredOrders = orders.filter(o => 
    activeTab === 'active' 
      ? (o.status !== 'completed' && o.status !== 'cancelled') 
      : (o.status === 'completed' || o.status === 'cancelled')
  );

  const displayedOrders = filteredOrders.filter(o => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return o.orderId.toLowerCase().includes(q) || (o.customerEmail?.toLowerCase().includes(q));
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 px-1">
        <div>
          <h2 className="text-white font-black tracking-wider text-sm">INCOMING STUDENT ORDERS</h2>
          <p className="text-slate-400 text-xs mt-0.5">Support WhatsApp: +91 9443071443</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 shadow-sm text-[11px] font-black rounded-full tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            MULTI-PHONE LIVE SYNC
          </div>
          <button className="text-blue-600 font-black text-[13px] tracking-wider flex items-center gap-1 hover:text-blue-700">
            <RefreshCw className="w-3.5 h-3.5" />
            SYNC
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 liquid-glass-sub rounded-2xl p-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 text-[12px] sm:text-[13px] tracking-wider rounded-xl transition-all duration-200 ${
            activeTab === 'active'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          ACTIVE ORDERS
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-[12px] sm:text-[13px] tracking-wider rounded-xl transition-all duration-200 ${
            activeTab === 'history'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          ORDER HISTORY
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 text-[12px] sm:text-[13px] tracking-wider rounded-xl transition-all duration-200 ${
            activeTab === 'users'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          USERS & ANALYTICS
        </button>
      </div>

      {activeTab === 'users' ? (
        <AdminUsersDashboard orders={orders} />
      ) : (
        <>
          {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search incoming orders by ID or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 liquid-glass-input rounded-xl text-sm transition-all"
        />
            </div>

      {/* Summary Section */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 liquid-glass rounded-2xl p-4 text-white flex items-center justify-between">
          <span className="text-slate-400 uppercase text-xs font-bold">Total Orders</span>
          <span className="text-white font-black text-xl">{displayedOrders.length}</span>
        </div>
        <div className="flex-1 liquid-glass rounded-2xl p-4 text-white flex items-center justify-between">
          <span className="text-slate-400 uppercase text-xs font-bold">Total Value</span>
          <span className="text-cyan-400 font-black text-xl">₹{displayedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0).toFixed(2)}</span>
        </div>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="text-center text-slate-500 py-16 bg-slate-900/20 backdrop-blur-sm rounded-[24px] border border-cyan-500/30 shadow-sm">
          <p className="font-medium text-lg">
            {activeTab === 'active' ? 'No active orders waiting' : 'No past order history'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedOrders.map(o => (
            <div key={o.orderId} className="relative liquid-glass rounded-[28px] p-6 text-white overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
              
              {/* Order Header */}
              <div className="relative z-10 flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-extrabold text-xl leading-tight">
                    {o.customerName?.split(' ')[0] || 'User'}
                  </h3>
                  <div className="flex items-center gap-1 text-slate-400 font-medium mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{o.customerPhone || 'No WhatsApp'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold text-cyan-400 leading-tight">
                    ₹{o.totalPrice?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-xs text-slate-400 font-medium mt-1">
                    #{o.orderId} • {formatDate(o.createdAt)}
                  </div>
                </div>
              </div>

              {/* Service Info Box */}
              <div className="liquid-glass-sub rounded-2xl p-4 text-white flex flex-col gap-3 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-[14px]">
                    <span className="font-bold text-slate-400 block mb-0.5 text-[11px] uppercase tracking-wider">Service & Copies</span>
                    <span className="font-semibold text-cyan-400">{o.serviceTitle}</span>
                    <span className="text-slate-400 block text-xs mt-0.5">{o.copies} {o.copies === 1 ? 'copy' : 'copies'} • {o.paperSize}</span>
                  </div>
                  <div className="text-[14px]">
                    <span className="font-bold text-slate-400 block mb-0.5 text-[11px] uppercase tracking-wider">Pickup / Delivery</span>
                    <span className="font-medium text-slate-200">{o.deliveryAddress}</span>
                  </div>
                </div>
                
                {(o.notes && o.notes !== 'None') || (o.customerEmail) ? (
                  <div className="border-t border-slate-700/60 pt-3 mt-1 grid grid-cols-2 gap-4">
                    {o.customerEmail && (
                      <div className="text-[14px]">
                        <span className="font-bold text-slate-400 block mb-0.5 text-[11px] uppercase tracking-wider">Email</span>
                        <span className="font-medium text-slate-200 break-all">{o.customerEmail}</span>
                      </div>
                    )}
                    {o.notes && o.notes !== 'None' && (
                      <div className="text-[14px]">
                        <span className="font-bold text-slate-400 block mb-0.5 text-[11px] uppercase tracking-wider">Instructions</span>
                        <span className="font-medium text-slate-200 italic">"{o.notes}"</span>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Files info */}
              <div className="border-t border-dashed border-slate-700/60 pt-4 pb-4">
                {o.files && o.files.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-bold text-slate-200 mb-2">Attached Documents ({o.files.length}):</div>
                    {o.files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-white">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <div className="w-8 h-8 rounded-lg bg-blue-900/50 text-blue-400 flex items-center justify-center shrink-0">
                             <span className="text-xs font-bold">DOC</span>
                           </div>
                           <div className="truncate">
                             <h5 className="font-bold text-xs text-white truncate">{file.name}</h5>
                             <p className="text-[11px] text-slate-400">{file.size} • {file.pageCount || 1} page(s)</p>
                           </div>
                        </div>
                        <a href={file.url || file.dataUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm italic text-slate-400 font-medium">
                    No files attached (Physical / WhatsApp handoff)
                  </div>
                )}
              </div>

              {/* Actions based on tab */}
              {activeTab === 'active' ? (
                <>
                  {/* Main Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                    {o.status === 'pending' ? (
                      <button
                        onClick={() => updateStatus(o.orderId, 'printing')}
                        className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <Play className="w-4 h-4 fill-white text-white" />
                        Set In Printing
                      </button>
                    ) : (
                      <div className="flex-1 py-3 px-4 bg-blue-950/60 text-blue-400 border border-blue-800 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm">
                        <Hourglass className="w-4 h-4" />
                        In Printing...
                      </div>
                    )}
                    
                    <button
                      onClick={() => updateStatus(o.orderId, 'completed')}
                      className="flex-[1.5] p-3 bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-700/60 rounded-xl flex items-center gap-3 transition-colors shadow-sm text-left"
                    >
                      <div className="w-6 h-6 rounded border border-emerald-600 bg-slate-800 shrink-0 flex items-center justify-center"></div>
                      <div>
                        <div className="text-[15px] font-bold text-emerald-300 leading-tight">Mark as Printout Completed</div>
                        <div className="text-xs font-medium text-emerald-400/80 mt-0.5">Check once printed</div>
                      </div>
                    </button>
                  </div>

                  {/* Bottom Actions */}
                  <div className="border-t border-dashed border-slate-700/60 pt-4 flex gap-3">
                    <button
                      onClick={() => updateStatus(o.orderId, 'cancelled')}
                      className="flex-1 py-2.5 bg-rose-950/40 text-rose-300 border border-rose-800/60 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Ban className="w-4 h-4" />
                      Cancel Order
                    </button>
                    {confirmDeleteId === o.orderId ? (
                      <button
                        onClick={() => handleDelete(o.orderId)}
                        className="py-2.5 px-6 bg-rose-600 text-white hover:bg-rose-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Confirm
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(o.orderId)}
                        className="py-2.5 px-6 bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/50 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="border-t border-dashed border-slate-700/60 pt-4 flex gap-3 items-center justify-between">
                  <div className={`px-4 py-2 rounded-xl font-bold text-sm inline-flex items-center gap-2 ${
                    o.status === 'completed' 
                      ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-700/60'
                      : 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
                  }`}>
                    {o.status === 'completed' ? 'Order Completed' : 'Order Cancelled'}
                  </div>
                  {confirmDeleteId === o.orderId ? (
                    <button
                      onClick={() => handleDelete(o.orderId)}
                      className="py-2.5 px-6 bg-rose-600 text-white hover:bg-rose-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Confirm
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(o.orderId)}
                      className="py-2.5 px-6 bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/50 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Permanently
                    </button>
                  )}
                </div>
              )}

            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
};
