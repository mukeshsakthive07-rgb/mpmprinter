import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PrintOrder, UserNotification, UserSettings } from '../types';
import { useAuth, db, auth } from './AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestore-errors';
import { collection, doc, onSnapshot, query, where, setDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';

interface AppContextType {
  orders: PrintOrder[];
  notifications: UserNotification[];
  settings: UserSettings | null;
  activeTab: 'order' | 'orders' | 'settings' | 'notifications' | 'receiver';
  setActiveTab: (tab: 'order' | 'orders' | 'settings' | 'notifications' | 'receiver') => void;
  unreadCount: number;
  toast: { message: string; type: 'success' | 'error' | 'info'; icon?: string } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info', icon?: string) => void;
  hideToast: () => void;
  createOrder: (orderData: any) => Promise<{ success: boolean; order?: PrintOrder; error?: string }>;
  deleteOrder: (orderId: string) => Promise<{ success: boolean; error?: string }>;
  updateOrderStatus: (orderId: string, status: PrintOrder['status']) => Promise<boolean>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  currentTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, user } = useAuth();
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  
  const [activeTab, setActiveTab] = useState<'order' | 'orders' | 'settings' | 'notifications' | 'receiver'>('order');

  useEffect(() => {
    if (user?.role === 'admin') setActiveTab('receiver');
    else if (user && activeTab === 'receiver') setActiveTab('order');
  }, [user?.role]);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; icon?: string } | null>(null);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', icon?: string) => {
    setToast({ message, type, icon });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  const applyTheme = useCallback((themePref: 'light' | 'dark' | 'system') => {
    let effectiveTheme: 'light' | 'dark' = 'light';
    if (themePref === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    } else {
      effectiveTheme = themePref;
    }
    setCurrentTheme(effectiveTheme);
    localStorage.setItem('mmprinter_theme', themePref);
    
    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, []);

  // Run once on mount to restore from local storage before firebase loads
  useEffect(() => {
    const saved = localStorage.getItem('mmprinter_theme') as 'light' | 'dark' | 'system' | null;
    if (saved) {
      applyTheme(saved);
    } else {
      // Check system preference initially
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        applyTheme('system');
      }
    }
  }, [applyTheme]);

  // Fetch data with Firestore
  useEffect(() => {
    if (!firebaseUser) {
      setOrders([]);
      setNotifications([]);
      setSettings(null);
      return;
    }

    // Orders
    const ordersUnsub = onSnapshot(query(collection(db, 'orders'), where('userId', '==', firebaseUser.uid)), (snap) => {
      const data = snap.docs.map(doc => ({ orderId: doc.id, ...doc.data() } as PrintOrder));
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      console.error("Error fetching orders:", error);
    });

    // Settings
    const settingsUnsub = onSnapshot(doc(db, 'users', firebaseUser.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.settings) {
          setSettings(data.settings);
          if (data.settings.appearance?.theme) {
            applyTheme(data.settings.appearance.theme);
          }
        }
      }
    }, (error) => {
      if (!auth.currentUser) return;
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    return () => {
      ordersUnsub();
      settingsUnsub();
    };
  }, [firebaseUser, applyTheme]);

  // Actions
  const createOrder = async (orderData: any) => {
    if (!firebaseUser || !user) return { success: false, error: 'Unauthorized' };
    try {
      const orderId = `MPM-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder = {
        customerPhone: user.phone || '', // fallback
        ...orderData,
        userId: firebaseUser.uid,
        customerName: orderData.customerName || user.name,
        customerEmail: user.email,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'orders', orderId), newOrder);
      showToast(`Order #${orderId} Placed Successfully!`, 'success', '🚀');
      setActiveTab('orders');
      return { success: true, order: { orderId, ...newOrder } as PrintOrder };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!firebaseUser) return { success: false };
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      showToast(`Order #${orderId} permanently deleted.`, 'info', '🗑️');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateOrderStatus = async (orderId: string, status: PrintOrder['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      showToast(`Order status updated to ${status}.`, 'info', '🔄');
      return true;
    } catch (err) {
      return false;
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!firebaseUser) return false;
    try {
      const merged = { ...settings, ...newSettings };
      await setDoc(doc(db, 'users', firebaseUser.uid), { settings: merged }, { merge: true });
      if (newSettings.appearance?.theme) applyTheme(newSettings.appearance.theme);
      return true;
    } catch (err) {
      return false;
    }
  };

  const setTheme = (themePref: 'light' | 'dark' | 'system') => {
    applyTheme(themePref);
    updateSettings({ appearance: { ...(settings?.appearance || {}), theme: themePref } });
  };

  const markNotificationRead = async (id: string) => {};
  const markAllNotificationsRead = async () => {};
  const clearAllNotifications = async () => {};

  return (
    <AppContext.Provider
      value={{
        orders,
        notifications,
        settings,
        activeTab,
        setActiveTab,
        unreadCount: notifications.filter(n => !n.read).length,
        toast,
        showToast,
        hideToast,
        createOrder,
        deleteOrder,
        updateOrderStatus,
        updateSettings,
        markNotificationRead,
        markAllNotificationsRead,
        clearAllNotifications,
        currentTheme,
        setTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
