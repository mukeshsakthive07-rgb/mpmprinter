import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, jsonb, doublePrecision } from 'drizzle-orm/pg-core';

// Define the 'users' table using Firebase Auth uid as identifier
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('student'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'print_orders' table
export const printOrders = pgTable('print_orders', {
  id: serial('id').primaryKey(),
  orderId: text('order_id').notNull().unique(),
  userId: text('user_id')
    .references(() => users.uid)
    .notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone'),
  serviceId: text('service_id').notNull(),
  serviceTitle: text('service_title'),
  rate: doublePrecision('rate').notNull(),
  unit: text('unit').notNull(),
  copies: integer('copies').notNull(),
  pageRange: text('page_range'),
  paperSize: text('paper_size').notNull(),
  orientation: text('orientation').notNull(),
  binding: text('binding').notNull(),
  bindingCost: doublePrecision('binding_cost').default(0),
  notes: text('notes'),
  deliveryAddress: text('delivery_address'),
  files: jsonb('files').notNull(),
  totalPrice: doublePrecision('total_price').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Define relationships for the 'users' table
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(printOrders),
}));

// Define relationships for the 'printOrders' table
export const printOrdersRelations = relations(printOrders, ({ one }) => ({
  user: one(users, {
    fields: [printOrders.userId],
    references: [users.uid],
  }),
}));
