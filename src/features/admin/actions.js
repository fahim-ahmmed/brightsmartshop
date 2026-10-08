'use server';

import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import { db } from '@/lib/mongo-client';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import Category from '@/models/Category';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Withdrawal from '@/models/Withdrawal';
import { postLedger } from '@/features/wallet/ledger';
import { applyDeliveredOrder } from '@/features/wallet/rewards';
import { audit } from './audit';
import { ENTITIES } from './entities';
import { ORDER_FLOW } from './flow';
import { assertAdmin } from './guard';

/**
 * Admin Action: Create Product with Local File Upload
 */
export async function createProductWithFileUpload(formData) {
  const admin = await assertAdmin();
  if (!admin) return { success: false, error: 'You must be an admin to create products.' };

  try {
    await connectDB();

    const name = String(formData.get('name') || '').trim();
    const categorySlug = String(formData.get('category') || '').trim();
    const price = Number(formData.get('price'));
    const description = String(formData.get('description') || '').trim();
    const stock = formData.get('stock') ? Number(formData.get('stock')) : 100;
    const isFeatured = formData.get('isFeatured') === 'true';
    const imageFile = formData.get('imageFile');
    const imageUrlInput = String(formData.get('imageUrl') || '').trim();

    if (name.length < 2 || name.length > 120 || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
      return { success: false, error: 'Enter a valid product name, price, and stock quantity.' };
    }

    const category = await Category.findOne({ slug: categorySlug, isActive: true }).select('_id').lean();
    if (!category) return { success: false, error: 'Select an active product category.' };

    let finalImageUrl = imageUrlInput || '/hero1.jpg';
    if (typeof File !== 'undefined' && imageFile instanceof File && imageFile.size > 0) {
      finalImageUrl = await uploadImageToCloudinary(imageFile);
    }

    const newProduct = await Product.create({
      name,
      slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${Date.now()}`,
      pricePaisa: Math.round(price * 100),
      category: category._id,
      images: [finalImageUrl],
      description,
      stock,
      pointsX100: 0,
      isFeatured,
      isActive: true,
    });

    await audit(admin, 'create', 'products', newProduct._id, `Created product ${name}`);
    revalidatePath('/shop');
    revalidatePath('/');
    revalidatePath('/admin/products');

    return {
      success: true, 
      message: 'Product and image saved successfully.',
      product: JSON.parse(JSON.stringify(newProduct))
    };
  } catch (error) {
    console.error('[admin product create]', error);
    return { success: false, error: error.message || 'Failed to create product.' };
  }
}

export async function deleteEntityAction(entity, id) {
  const admin = await assertAdmin();
  if (!admin) return { error: 'You must be an admin to delete items.' };
  if (typeof entity !== 'string' || !Object.hasOwn(ENTITIES, entity)) return { error: 'Unknown item type.' };
  if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) return { error: 'Invalid item ID.' };

  const definition = ENTITIES[entity];
  if (!definition.canDelete) return { error: `${definition.plural} cannot be deleted.` };

  await connectDB();
  const blockReason = await definition.beforeDelete?.(new ObjectId(id));
  if (blockReason) return { error: blockReason };

  const deleted = await definition.model.findByIdAndDelete(id);
  if (!deleted) return { error: 'Item not found.' };

  await audit(admin, 'delete', entity, id, `Deleted ${definition.label}`);
  revalidatePath(`/admin/${entity}`);
  revalidatePath('/');
  revalidatePath('/shop');
  return { success: true };
}

export async function updateOrderStatusAction(orderNo, _previousState, formData) {
  const admin = await assertAdmin();
  if (!admin) return { error: 'You must be an admin to update orders.' };
  if (typeof orderNo !== 'string' || typeof formData?.get !== 'function') return { error: 'Invalid order request.' };

  const nextStatus = formData.get('status');
  if (typeof nextStatus !== 'string') return { error: 'Choose a valid order status.' };

  await connectDB();
  const order = await Order.findOne({ orderNo });
  if (!order) return { error: 'Order not found.' };
  if (!(ORDER_FLOW[order.status] || []).includes(nextStatus)) {
    return { error: 'That status change is not allowed.' };
  }

  const update = { status: nextStatus };
  if (nextStatus === 'delivered') update.deliveredAt = new Date();
  const changed = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { $set: update },
    { new: true }
  );
  if (!changed) return { error: 'The order changed. Refresh and try again.' };

  let warning;
  if (nextStatus === 'delivered') {
    try {
      await applyDeliveredOrder(order._id);
    } catch (error) {
      console.error('[admin order rewards]', error);
      warning = 'Order status updated, but rewards could not be applied. Use the retry button.';
    }
  }

  await audit(admin, 'order_status', 'orders', order._id, `${order.status} → ${nextStatus}`);
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderNo}`);
  revalidatePath('/orders');
  revalidatePath('/dashboard');
  return { success: true, ...(warning ? { warning } : {}) };
}

export async function retryRewardsAction(orderNo) {
  const admin = await assertAdmin();
  if (!admin) return { error: 'You must be an admin to apply rewards.' };
  if (typeof orderNo !== 'string' || !orderNo) return { error: 'Invalid order number.' };

  await connectDB();
  const order = await Order.findOne({ orderNo }).select('_id status rewardsApplied').lean();
  if (!order || order.status !== 'delivered') return { error: 'Only delivered orders can receive rewards.' };
  if (order.rewardsApplied) return { error: 'Rewards have already been applied.' };

  try {
    const result = await applyDeliveredOrder(order._id);
    if (!result.applied) return { error: 'Rewards were not applied. Refresh and check the order status.' };
  } catch (error) {
    console.error('[admin reward retry]', error);
    return { error: 'Rewards could not be applied. Please try again.' };
  }

  await audit(admin, 'retry_rewards', 'orders', order._id, `Retried rewards for ${orderNo}`);
  revalidatePath(`/admin/orders/${orderNo}`);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function setUserRoleAction(userId, role) {
  const admin = await assertAdmin();
  if (!admin) return { error: 'You must be an admin to change roles.' };
  if (typeof userId !== 'string' || !userId || !['admin', 'user'].includes(role)) {
    return { error: 'Invalid user or role.' };
  }
  if (String(admin.id) === userId) return { error: 'You cannot change your own role.' };

  await connectDB();
  const idFilter = /^[a-f\d]{24}$/i.test(userId)
    ? { $in: [userId, new ObjectId(userId)] }
    : userId;
  const result = await db.collection('user').updateOne({ _id: idFilter }, { $set: { role } });
  if (result.matchedCount !== 1) return { error: 'User not found.' };

  await audit(admin, 'role', 'users', userId, `Changed user role to ${role}`);
  revalidatePath('/admin/users');
  return { success: true };
}

export async function processWithdrawalAction(id, action, _previousState, formData) {
  const admin = await assertAdmin();
  if (!admin) return { error: 'You must be an admin to process withdrawals.' };
  if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) return { error: 'Invalid withdrawal ID.' };
  if (!['approve', 'paid', 'reject'].includes(action)) return { error: 'Invalid withdrawal action.' };

  await connectDB();
  const withdrawal = await Withdrawal.findById(id).lean();
  if (!withdrawal) return { error: 'Withdrawal request not found.' };

  const transitions = {
    pending: { approve: 'approved', reject: 'rejected' },
    approved: { paid: 'paid', reject: 'rejected' },
  };
  const nextStatus = transitions[withdrawal.status]?.[action];
  if (!nextStatus) return { error: 'That withdrawal status change is not allowed.' };

  const note = typeof formData?.get === 'function' ? String(formData.get('note') || '').trim().slice(0, 300) : '';
  const updated = await Withdrawal.findOneAndUpdate(
    { _id: withdrawal._id, status: withdrawal.status },
    { $set: { status: nextStatus, adminNote: note, processedBy: admin.id, processedAt: new Date() } },
    { new: true }
  );
  if (!updated) return { error: 'The request changed. Refresh and try again.' };

  if (nextStatus === 'rejected') {
    try {
      const result = await postLedger({
        userId: withdrawal.userId,
        type: 'release',
        reason: 'withdraw_rejected',
        amountPaisa: withdrawal.amountPaisa,
        refType: 'withdrawal',
        refId: String(withdrawal._id),
        note: note || 'Withdrawal rejected',
      });
      if (!result.ok) throw new Error(`Could not return withdrawal funds (${result.reason}).`);
    } catch (error) {
      const rollback = await Withdrawal.updateOne(
        { _id: withdrawal._id, status: 'rejected', processedBy: admin.id },
        { $set: { status: withdrawal.status, adminNote: '', processedBy: '', processedAt: null } }
      );
      if (rollback.modifiedCount !== 1) {
        console.error('[admin withdrawal rollback]', error);
        return { error: 'Withdrawal status changed, but returning the funds failed. Contact support.' };
      }
      console.error('[admin withdrawal release]', error);
      return { error: 'Could not return the funds. The request was restored; please try again.' };
    }
  }

  await audit(admin, 'withdrawal', 'withdrawals', id, `${withdrawal.status} → ${nextStatus}`);
  revalidatePath('/admin/withdrawals');
  revalidatePath('/dashboard');
  return { success: true };
}