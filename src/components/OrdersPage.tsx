import React, { useState } from 'react';
import { PrintOrder } from '../types';
import { Check, Trash2, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'pending') {
    return (
      <span className="px-3 py-1.5 bg-[#FDF0D5] text-[#B26E12] text-sm font-bold rounded-full">
        Order Placed
      </span>
    );
  }
  if (status === 'printing') {
    return (
      <span className="px-3 py-1.5 bg-[#DBEAFE] text-[#1D4ED8] text-sm font-bold rounded-full">
        Printing in Progress 🖨️
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="px-3 py-1.5 bg-[#D1FAE5] text-[#047857] text-sm font-bold rounded-full">
        Ready for Pickup 📦
      </span>
    );
  }
  return (
    <span className="px-3 py-1.5 bg-rose-100 text-rose-700 text-sm font-bold rounded-full capitalize">
      {status}
    </span>
  );
};

const ProgressTracker = ({ status }: { status: string }) => {
  const isPrinting = status === 'printing';
  const isCompleted = status === 'completed';
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="py-6 text-center text-slate-500 font-medium">
        This order was cancelled.
      </div>
    );
  }

  return (
    <div className="relative mb-8 px-4 sm:px-12">
      {/* Background Track */}
      <div className="absolute top-[15px] left-12 right-12 h-[3px] bg-slate-800/80 z-0"></div>

      <div className="flex justify-between items-start relative z-10">
        {/* Step 1: Received */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            {status === 'pending' && <div className="absolute inset-0 rounded-full bg-[#10B981] animate-ping opacity-75"></div>}
            <div className="relative z-10 w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-sm">
              <Check className="w-5 h-5" strokeWidth={3} />
            </div>
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">Received</span>
        </div>

        {/* Step 2: Printing */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            {isPrinting && <div className="absolute inset-0 rounded-full bg-[#2563EB] animate-ping opacity-75"></div>}
            {isPrinting || isCompleted ? (
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                isCompleted ? 'bg-[#10B981] text-white' : 'bg-[#2563EB] text-white'
              }`}>
                {isCompleted ? <Check className="w-5 h-5" strokeWidth={3} /> : '2'}
              </div>
            ) : (
              <div className="relative z-10 w-8 h-8 rounded-full bg-slate-900/40 border-[3px] border-slate-700 text-slate-500 flex items-center justify-center text-sm font-bold">
                2
              </div>
            )}
          </div>
          <span className={`text-sm font-bold ${isPrinting || isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
            Printing
          </span>
        </div>

        {/* Step 3: Ready */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            {isCompleted && <div className="absolute inset-0 rounded-full bg-[#2563EB] animate-ping opacity-75"></div>}
            {isCompleted ? (
              <div className="relative z-10 w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-sm font-bold shadow-sm">
                3
              </div>
            ) : (
              <div className="relative z-10 w-8 h-8 rounded-full bg-slate-900/40 border-[3px] border-slate-700 text-slate-500 flex items-center justify-center text-sm font-bold">
                3
              </div>
            )}
          </div>
          <span className={`text-sm font-bold ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
            Ready
          </span>
        </div>
      </div>
    </div>
  );
};

export const OrdersPage: React.FC = () => {
  const { orders, showToast, deleteOrder } = useApp();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'printing');
  const historyOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');
  const baseDisplayedOrders = activeTab === 'active' ? activeOrders : historyOrders;
  
  const displayedOrders = baseDisplayedOrders.filter(o => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return o.orderId.toLowerCase().includes(q) || (o.customerEmail?.toLowerCase().includes(q));
  });

  const handleDelete = async (orderId: string) => {
    try {
      const res = await deleteOrder(orderId);
      if (!res.success) { throw new Error(res.error); }
    } catch (error) {
      console.error(error); showToast('Failed to delete order.', 'error');
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const time = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
    return `${day} ${month}, ${time}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-transparent text-white">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-1">
        <h2 className="text-sm font-black text-slate-500 tracking-wider">📦 MY PRINT ORDERS</h2>
        <span className="text-sm font-black text-slate-500 tracking-wider hidden sm:inline-block">REAL-TIME STATUS</span>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search by order ID or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 liquid-glass-input rounded-xl text-sm transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 liquid-glass-sub p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors ${
            activeTab === 'active'
              ? 'liquid-glass-active text-cyan-300'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors ${
            activeTab === 'history'
              ? 'liquid-glass-active text-cyan-300'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Order History ({historyOrders.length})
        </button>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="text-center text-slate-500 py-16 bg-slate-900/20 backdrop-blur-md rounded-[24px] border border-cyan-500/30 shadow-sm">
          <p className="font-medium text-lg">No orders yet</p>
          <p className="text-sm mt-1">Place a print order to see it tracked here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedOrders.map(o => (
            <div key={o.orderId} className="relative liquid-glass rounded-[28px] p-6 text-white mb-6 overflow-hidden text-white">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
              
              {/* Order Header */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="text-cyan-400 font-extrabold text-xl sm:text-2xl">#{o.orderId}</h3>
                    <span className="text-cyan-400 font-extrabold text-xl sm:text-2xl">
                      • {o.customerName?.split(' ')[0] || 'User'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{formatDate(o.createdAt)}</p>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={o.status} />
                </div>
              </div>

              {/* Tracker */}
              <ProgressTracker status={o.status} />

              {/* Footer Info Box */}
              <div className="relative z-10 liquid-glass-sub rounded-2xl p-4 sm:px-5 flex justify-between items-center text-white">
                <div>
                  <div className="text-[15px] font-bold mb-0.5">
                    Item: <span className="font-medium text-slate-300">{o.serviceTitle}</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    {o.copies} {o.copies === 1 ? 'copy' : 'copies'}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div className="text-cyan-400 font-bold text-lg">
                    ₹{o.totalPrice?.toFixed(2) || '0.00'}
                  </div>
                  {confirmDeleteId === o.orderId ? (
                    <button onClick={() => handleDelete(o.orderId)} className="bg-rose-600 text-white hover:bg-rose-500 rounded-lg text-xs font-bold px-3 py-1.5 flex items-center gap-1 transition-colors">
                      <Trash2 className="w-4 h-4" /> Confirm
                    </button>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(o.orderId)} className="bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/50 rounded-lg text-xs font-bold px-3 py-1.5 flex items-center gap-1 transition-colors">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
