import { db } from './index.ts';
import { printOrders } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import type { PrintOrder } from '../types.ts';

export async function createOrderInDb(order: PrintOrder) {
  try {
    const result = await db.insert(printOrders).values({
      orderId: order.orderId,
      userId: order.userId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone || '',
      serviceId: order.serviceId,
      serviceTitle: order.serviceTitle || '',
      rate: order.rate,
      unit: order.unit,
      copies: order.copies,
      pageRange: order.pageRange || '',
      paperSize: order.paperSize,
      orientation: order.orientation,
      binding: order.binding,
      bindingCost: order.bindingCost || 0,
      notes: order.notes || '',
      deliveryAddress: order.deliveryAddress || '',
      files: order.files || [],
      totalPrice: order.totalPrice,
      status: order.status || 'pending',
    }).returning();

    return result[0];
  } catch (error) {
    console.error('Database createOrder failed:', error);
    throw new Error('Database order creation failed. Please try again later.', { cause: error });
  }
}

export async function getOrdersByUser(userId: string) {
  try {
    return await db.select().from(printOrders).where(eq(printOrders.userId, userId)).orderBy(desc(printOrders.createdAt));
  } catch (error) {
    console.error('Database getOrdersByUser failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getAllOrders() {
  try {
    return await db.select().from(printOrders).orderBy(desc(printOrders.createdAt));
  } catch (error) {
    console.error('Database getAllOrders failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function updateOrderStatusInDb(orderId: string, status: string) {
  try {
    const result = await db.update(printOrders)
      .set({ 
        status,
        ...(status === 'completed' ? { completedAt: new Date() } : {})
      })
      .where(eq(printOrders.orderId, orderId))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database updateOrderStatus failed:', error);
    throw new Error('Database order update failed. Please try again later.', { cause: error });
  }
}

export async function deleteOrderFromDb(orderId: string) {
  try {
    const result = await db.delete(printOrders).where(eq(printOrders.orderId, orderId)).returning();
    return result.length > 0;
  } catch (error) {
    console.error('Database deleteOrder failed:', error);
    throw new Error('Database order deletion failed. Please try again later.', { cause: error });
  }
}
