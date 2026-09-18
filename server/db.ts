import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  PrintOrder,
  UserProfile,
  UserNotification,
  UserSettings,
  SavedAddress,
  SavedPaymentMethod
} from '../src/types';

interface DBUser extends UserProfile {
  passwordHash: string;
  passwordSalt: string;
}

interface DBSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  rememberMe: boolean;
  userAgent?: string;
  ip?: string;
}

interface DBPendingReset {
  email: string;
  otp: string;
  expiresAt: number;
}

interface DatabaseSchema {
  users: DBUser[];
  sessions: DBSession[];
  orders: PrintOrder[];
  notifications: UserNotification[];
  settings: Record<string, UserSettings>;
  passwordResets: DBPendingReset[];
  printRates: Record<string, number>;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'printer_db.json');

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const attempt = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(attempt, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

const defaultSettings: UserSettings = {
  notifications: {
    email: true,
    order: true,
    whatsapp: true,
    securityAlerts: true,
    promotional: false,
    systemUpdates: true,
  },
  appearance: {
    theme: 'system',
    fontSize: 'medium',
    compactMode: false,
  },
  languageAndRegion: {
    language: 'English',
    country: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    timeZone: 'Asia/Kolkata (IST)',
    dateFormat: 'DD/MM/YYYY',
  },
  privacy: {
    profileVisibility: 'campus',
    dataSharing: false,
    personalizedRecommendations: true,
    activityTracking: false,
  },
  addresses: [
    {
      id: 'addr-default',
      label: 'Campus Hostel Block A',
      addressLine: 'Room 304, Boys Hostel Block A, College Campus, Erode Main Road',
      isDefault: true,
    },
    {
      id: 'addr-dept',
      label: 'Mechanical Dept Labs',
      addressLine: 'CAD/CAM Lab, 2nd Floor, Mechanical Engineering Block',
      isDefault: false,
    },
  ],
  paymentMethods: [
    {
      id: 'pm-upi-1',
      type: 'upi',
      title: 'Google Pay UPI',
      maskedInfo: 'mukeshsakthi@okaxis',
      isDefault: true,
    },
    {
      id: 'pm-card-1',
      type: 'card',
      title: 'HDFC Platinum Debit Card',
      maskedInfo: '•••• •••• •••• 4289',
      isDefault: false,
    },
  ],
};

function getInitialData(): DatabaseSchema {
  const { hash, salt } = hashPassword('Password@123');
  const demoUserId = 'usr-mukesh-01';
  const adminUserId = 'usr-admin-01';

  const demoUser: DBUser = {
    id: demoUserId,
    name: 'Mukesh Sakthivel',
    email: 'mukeshsakthive07@gmail.com',
    phone: '+91 94430 71443',
    username: 'mukesh07',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    role: 'student',
    isActive: true,
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    passwordHash: hash,
    passwordSalt: salt,
  };

  const adminUser: DBUser = {
    id: adminUserId,
    name: 'Mugilan & Mukesh',
    email: 'admin@mmprinter.com',
    phone: '+91 98765 43210',
    username: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1542157585-ef20bbcce4e7?w=200&auto=format&fit=crop&q=80',
    role: 'receiver',
    isActive: true,
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    passwordHash: hash,
    passwordSalt: salt,
  };

  const initialOrders: PrintOrder[] = [
    {
      orderId: 'MPM-1042',
      userId: demoUserId,
      customerName: 'Mukesh Sakthivel',
      customerEmail: 'mukeshsakthive07@gmail.com',
      customerPhone: '+91 94430 71443',
      serviceId: 'bw-double',
      serviceTitle: 'Double Side (Black & White)',
      rate: 1.4,
      unit: 'page',
      copies: 2,
      pageRange: 'All Pages (1-24)',
      paperSize: 'A4',
      orientation: 'Portrait',
      binding: 'spiral',
      bindingCost: 30,
      notes: 'Please bind with blue translucent front cover',
      deliveryAddress: 'Room 304, Boys Hostel Block A',
      files: [
        {
          id: 'file-101',
          name: 'CAD_Engineering_Design_Project.pdf',
          size: '4.2 MB',
          type: 'application/pdf',
          pageCount: 24,
        },
      ],
      totalPrice: (24 * 1.4 * 2) + 30,
      status: 'printing',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      completedAt: null,
    },
    {
      orderId: 'MPM-0985',
      userId: demoUserId,
      customerName: 'Mukesh Sakthivel',
      customerEmail: 'mukeshsakthive07@gmail.com',
      customerPhone: '+91 94430 71443',
      serviceId: 'colour',
      serviceTitle: 'Colour Print Out',
      rate: 6.8,
      unit: 'page',
      copies: 1,
      pageRange: 'Pages 1-5',
      paperSize: 'A4',
      orientation: 'Portrait',
      binding: 'none',
      bindingCost: 0,
      notes: 'High gloss print for symposium seminar presentation',
      deliveryAddress: 'Direct Shop Pickup',
      files: [
        {
          id: 'file-102',
          name: 'Robotics_Symposium_Poster.pdf',
          size: '8.1 MB',
          type: 'application/pdf',
          pageCount: 5,
        },
      ],
      totalPrice: 5 * 6.8,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      completedAt: '11:45 AM',
    },
  ];

  const initialNotifications: UserNotification[] = [
    {
      id: 'notif-1',
      userId: demoUserId,
      title: 'Order In Printing 🖨️',
      message: 'Your print order #MPM-1042 is currently on the printer at MPM PRINTER.',
      type: 'order',
      read: false,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      relatedOrderId: 'MPM-1042',
    },
    {
      id: 'notif-2',
      userId: demoUserId,
      title: 'Printout Ready for Pickup! 🎉',
      message: 'Order #MPM-0985 has been printed and is ready for pickup at MPM PRINTER shop counter.',
      type: 'order',
      read: true,
      createdAt: new Date(Date.now() - 86400000 * 2 + 7200000).toISOString(),
      relatedOrderId: 'MPM-0985',
    },
  ];

  return {
    users: [demoUser, adminUser],
    sessions: [],
    orders: initialOrders,
    notifications: initialNotifications,
    settings: {
      [demoUserId]: defaultSettings,
    },
    passwordResets: [],
    printRates: {
      'bw-single': 1.0,
      'bw-double': 1.4,
      'colour': 6.8,
      'photo': 18.0
    }
  };
}

class DatabaseManager {
  private data: DatabaseSchema;
  private listeners: Array<() => void> = [];

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error loading DB file, creating fresh database:', err);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      const payload = dataToSave || this.data;
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
      this.notifyListeners();
    } catch (err) {
      console.error('Failed to save DB file:', err);
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('Listener notify error:', err);
      }
    }
  }

  // --- USER AUTHENTICATION ---
  public registerUser(params: {
    name: string;
    email: string;
    phone: string;
    username?: string;
    password: string;
  }): { success: boolean; user?: UserProfile; error?: string } {
    const emailNorm = params.email.trim().toLowerCase();
    const existing = this.data.users.find((u) => u.email.toLowerCase() === emailNorm);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    const username = params.username?.trim() || emailNorm.split('@')[0];
    const { hash, salt } = hashPassword(params.password);
    const userId = `usr-${crypto.randomBytes(6).toString('hex')}`;

    const newUser: DBUser = {
      id: userId,
      name: params.name.trim(),
      email: emailNorm,
      phone: params.phone.trim(),
      username,
      avatarUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(username)}`,
      role: 'student',
      isActive: true,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      passwordHash: hash,
      passwordSalt: salt,
    };

    this.data.users.push(newUser);
    this.data.settings[userId] = JSON.parse(JSON.stringify(defaultSettings));
    
    // Add welcome notification
    this.createNotification({
      userId,
      title: 'Welcome to MPM PRINTER! 👋',
      message: 'Your student printout account is ready. Order printouts, track queues, and configure settings with ease.',
      type: 'system',
    });

    this.saveData();

    const { passwordHash, passwordSalt, ...profile } = newUser;
    return { success: true, user: profile };
  }

  public loginUser(
    emailOrUsername: string,
    password: string,
    rememberMe: boolean = false,
    meta?: { userAgent?: string; ip?: string }
  ): { success: boolean; token?: string; user?: UserProfile; error?: string } {
    const query = emailOrUsername.trim().toLowerCase();
    const user = this.data.users.find(
      (u) => u.email.toLowerCase() === query || u.username.toLowerCase() === query
    );

    if (!user) {
      return { success: false, error: 'Invalid email/username or password.' };
    }

    if (!user.isActive) {
      return { success: false, error: 'Account is deactivated or blocked. Please contact shop administration.' };
    }

    const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      return { success: false, error: 'Invalid email/username or password.' };
    }

    user.lastLoginAt = new Date().toISOString();

    // Session duration: 30 days if rememberMe, otherwise 24 hours
    const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const token = `mmp_tok_${crypto.randomBytes(32).toString('hex')}`;
    const now = Date.now();

    const session: DBSession = {
      token,
      userId: user.id,
      createdAt: now,
      expiresAt: now + duration,
      rememberMe,
      userAgent: meta?.userAgent,
      ip: meta?.ip,
    };

    this.data.sessions.push(session);
    this.saveData();

    const { passwordHash, passwordSalt, ...profile } = user;
    return { success: true, token, user: profile };
  }

  public validateToken(token: string): UserProfile | null {
    if (!token) return null;
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.destroySession(token);
      return null;
    }

    const user = this.data.users.find((u) => u.id === session.userId);
    if (!user || !user.isActive) {
      this.destroySession(token);
      return null;
    }

    const { passwordHash, passwordSalt, ...profile } = user;
    return profile;
  }

  public destroySession(token: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.saveData();
  }

  public destroyAllSessionsForUser(userId: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.userId !== userId);
    this.saveData();
  }

  public getUserSessions(userId: string) {
    return this.data.sessions.filter((s) => s.userId === userId);
  }

  // --- FORGOT & RESET PASSWORD ---
  public requestPasswordReset(email: string): { success: boolean; otp?: string; error?: string } {
    const emailNorm = email.trim().toLowerCase();
    const user = this.data.users.find((u) => u.email.toLowerCase() === emailNorm);
    if (!user) {
      return { success: false, error: 'No account found with this email address.' };
    }

    // Generate 6 digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    this.data.passwordResets = this.data.passwordResets.filter((r) => r.email !== emailNorm);
    this.data.passwordResets.push({
      email: emailNorm,
      otp,
      expiresAt,
    });

    this.saveData();
    return { success: true, otp };
  }

  public resetPasswordWithOtp(
    email: string,
    otp: string,
    newPass: string
  ): { success: boolean; error?: string } {
    const emailNorm = email.trim().toLowerCase();
    const pending = this.data.passwordResets.find(
      (r) => r.email === emailNorm && r.otp.trim() === otp.trim()
    );

    if (!pending) {
      return { success: false, error: 'Invalid or expired verification code.' };
    }

    if (Date.now() > pending.expiresAt) {
      return { success: false, error: 'Verification code has expired. Please request a new one.' };
    }

    const user = this.data.users.find((u) => u.email.toLowerCase() === emailNorm);
    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    const { hash, salt } = hashPassword(newPass);
    user.passwordHash = hash;
    user.passwordSalt = salt;

    this.data.passwordResets = this.data.passwordResets.filter((r) => r.email !== emailNorm);
    this.destroyAllSessionsForUser(user.id);
    this.saveData();

    return { success: true };
  }

  public changePassword(
    userId: string,
    currentPass: string,
    newPass: string
  ): { success: boolean; error?: string } {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };

    const valid = verifyPassword(currentPass, user.passwordHash, user.passwordSalt);
    if (!valid) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    const { hash, salt } = hashPassword(newPass);
    user.passwordHash = hash;
    user.passwordSalt = salt;

    this.createNotification({
      userId,
      title: 'Security Notice: Password Changed 🔐',
      message: 'Your account password was updated successfully.',
      type: 'security',
    });

    this.saveData();
    return { success: true };
  }

  // --- USER PROFILE & ACCOUNT ---
  public updateUserProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, 'name' | 'phone' | 'username' | 'avatarUrl' | 'twoFactorEnabled'>>
  ): UserProfile | null {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;

    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.phone !== undefined) user.phone = updates.phone.trim();
    if (updates.username !== undefined) user.username = updates.username.trim();
    if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
    if (updates.twoFactorEnabled !== undefined) user.twoFactorEnabled = updates.twoFactorEnabled;

    this.saveData();

    const { passwordHash, passwordSalt, ...profile } = user;
    return profile;
  }

  public deleteUserAccount(userId: string): boolean {
    const index = this.data.users.findIndex((u) => u.id === userId);
    if (index === -1) return false;

    this.data.users.splice(index, 1);
    this.data.orders = this.data.orders.filter((o) => o.userId !== userId);
    this.data.notifications = this.data.notifications.filter((n) => n.userId !== userId);
    this.data.sessions = this.data.sessions.filter((s) => s.userId !== userId);
    delete this.data.settings[userId];

    this.saveData();
    return true;
  }

  // --- ORDERS MANAGEMENT & REAL-TIME SYNC ---
  public getUserOrders(userId: string): PrintOrder[] {
    return this.data.orders
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllOrders(): PrintOrder[] {
    return [...this.data.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getOrder(orderId: string): PrintOrder | null {
    return this.data.orders.find((o) => o.orderId === orderId) || null;
  }

  public createOrder(order: Omit<PrintOrder, 'orderId' | 'createdAt'>): PrintOrder {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `MPM-${randomNum}`;

    const newOrder: PrintOrder = {
      ...order,
      orderId,
      createdAt: new Date().toISOString(),
    };

    this.data.orders.unshift(newOrder);

    this.createNotification({
      userId: order.userId,
      title: `Order Placed #${orderId} 🚀`,
      message: `Your print job for ${order.serviceTitle} (${order.copies} ${
        order.copies > 1 ? 'copies' : 'copy'
      }) has been received by MPM PRINTER.`,
      type: 'order',
      relatedOrderId: orderId,
    });

    this.saveData();
    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: PrintOrder['status']): PrintOrder | null {
    const order = this.data.orders.find((o) => o.orderId === orderId);
    if (!order) return null;

    order.status = status;
    if (status === 'completed') {
      order.completedAt = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      this.createNotification({
        userId: order.userId,
        title: `Printout Ready for Pickup! 🎉 (#${orderId})`,
        message: `Your print order #${orderId} has been completed and is ready at MPM PRINTER counter.`,
        type: 'order',
        relatedOrderId: orderId,
      });
    } else if (status === 'printing') {
      this.createNotification({
        userId: order.userId,
        title: `Order in Printing 🖨️ (#${orderId})`,
        message: `MPM PRINTER has started printing order #${orderId}.`,
        type: 'order',
        relatedOrderId: orderId,
      });
    } else if (status === 'cancelled') {
      this.createNotification({
        userId: order.userId,
        title: `Order Cancelled ❌ (#${orderId})`,
        message: `Order #${orderId} was cancelled.`,
        type: 'order',
        relatedOrderId: orderId,
      });
    }

    this.saveData();
    return order;
  }

  public deleteOrder(orderId: string, userId: string): { success: boolean; order?: PrintOrder } {
    const index = this.data.orders.findIndex(
      (o) => o.orderId === orderId && (o.userId === userId || userId === 'ADMIN')
    );

    if (index === -1) {
      return { success: false };
    }

    const [deletedOrder] = this.data.orders.splice(index, 1);

    // CRITICAL USER MANDATE:
    // "When an order is successfully deleted, send an appropriate notification to the user confirming that the order has been deleted.
    // The notification status should also stay synchronized across devices."
    this.createNotification({
      userId: deletedOrder.userId,
      title: `Order Deleted 🗑️ (#${orderId})`,
      message: `Your order #${orderId} (${deletedOrder.serviceTitle}) was permanently deleted from your records and database.`,
      type: 'deletion',
      relatedOrderId: orderId,
    });

    this.saveData();
    return { success: true, order: deletedOrder };
  }

  // --- NOTIFICATIONS ---
  public getUserNotifications(userId: string): UserNotification[] {
    return this.data.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(params: {
    userId: string;
    title: string;
    message: string;
    type: UserNotification['type'];
    relatedOrderId?: string;
  }): UserNotification {
    const notification: UserNotification = {
      id: `notif-${crypto.randomBytes(6).toString('hex')}`,
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      read: false,
      createdAt: new Date().toISOString(),
      relatedOrderId: params.relatedOrderId,
    };

    this.data.notifications.unshift(notification);
    this.saveData();
    return notification;
  }

  public markNotificationAsRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id && n.userId === userId);
    if (!notif) return false;
    notif.read = true;
    this.saveData();
    return true;
  }

  public markAllNotificationsAsRead(userId: string): void {
    for (const n of this.data.notifications) {
      if (n.userId === userId) {
        n.read = true;
      }
    }
    this.saveData();
  }

  public clearAllNotifications(userId: string): void {
    this.data.notifications = this.data.notifications.filter((n) => n.userId !== userId);
    this.saveData();
  }

  // --- SETTINGS ---
  public getUserSettings(userId: string): UserSettings {
    if (!this.data.settings[userId]) {
      this.data.settings[userId] = JSON.parse(JSON.stringify(defaultSettings));
      this.saveData();
    }
    return this.data.settings[userId];
  }

  public updateUserSettings(userId: string, newSettings: Partial<UserSettings>): UserSettings {
    const current = this.getUserSettings(userId);
    const updated: UserSettings = {
      ...current,
      ...newSettings,
      notifications: {
        ...current.notifications,
        ...(newSettings.notifications || {}),
      },
      appearance: {
        ...current.appearance,
        ...(newSettings.appearance || {}),
      },
      languageAndRegion: {
        ...current.languageAndRegion,
        ...(newSettings.languageAndRegion || {}),
      },
      privacy: {
        ...current.privacy,
        ...(newSettings.privacy || {}),
      },
      addresses: newSettings.addresses !== undefined ? newSettings.addresses : current.addresses,
      paymentMethods:
        newSettings.paymentMethods !== undefined ? newSettings.paymentMethods : current.paymentMethods,
    };

    this.data.settings[userId] = updated;
    this.saveData();
    return updated;
  }

  public exportUserData(userId: string) {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;
    const { passwordHash, passwordSalt, ...profile } = user;
    const orders = this.getUserOrders(userId);
    const notifications = this.getUserNotifications(userId);
    const settings = this.getUserSettings(userId);

    return {
      exportedAt: new Date().toISOString(),
      profile,
      orders,
      notifications,
      settings,
    };
  }

  // Rate Management
  public getPrintRates(): Record<string, number> {
    return this.data.printRates || {
      'bw-single': 1.0,
      'bw-double': 1.4,
      'colour': 6.8,
      'photo': 18.0
    };
  }
  
  public updatePrintRates(newRates: Record<string, number>): void {
    this.data.printRates = { ...this.data.printRates, ...newRates };
    this.saveData();
    
  }

  }
export const db = new DatabaseManager();