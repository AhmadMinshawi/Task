import { isActiveRecord } from '../../core/recordState.js';

function amount(value) { return Number(value) || 0; }

export function projectLedger(state, projectId, { excludePaymentId = null, excludeDeliveryId = null } = {}) {
  const paid = (state.payments ?? []).filter(item => isActiveRecord(item) && item.projectId === projectId && item.id !== excludePaymentId).reduce((sum, item) => sum + amount(item.amount), 0);
  const delivered = (state.deliveries ?? []).filter(item => isActiveRecord(item) && item.projectId === projectId && item.id !== excludeDeliveryId).reduce((sum, item) => sum + amount(item.quantity), 0);
  return Object.freeze({ paid, delivered });
}

export function projectIntegrityIssues(state, project) {
  if (!project) return [];
  const totalVideos = amount(project.totalVideos);
  const price = amount(project.pricePerVideo);
  const hasFixedTotal = totalVideos > 0;
  const projectValue = price * totalVideos;
  const { paid, delivered } = projectLedger(state, project.id);
  const issues = [];
  if (hasFixedTotal && delivered > totalVideos) issues.push({ code: 'over-delivered', message: `تم تسجيل ${delivered} فيديو بينما إجمالي المشروع ${totalVideos}.` });
  if (hasFixedTotal && paid > projectValue) issues.push({ code: 'overpaid', message: `المدفوع ${money(paid)} أكبر من قيمة المشروع ${money(projectValue)}.` });
  if (!hasFixedTotal && paid > 0 && price <= 0) issues.push({ code: 'missing-price', message: 'أضف سعر الفيديو لحساب الرصيد المتبقي.' });
  if (!hasFixedTotal && price > 0 && delivered * price > paid) issues.push({ code: 'unfunded-deliveries', message: `قيمة الفيديوهات المسلّمة ${money(delivered * price)} أكبر من الرصيد المدفوع ${money(paid)}.` });
  if (hasFixedTotal && project.status === 'completed' && delivered < totalVideos) issues.push({ code: 'incomplete-completed', message: 'المشروع مكتمل لكن كل الفيديوهات لم تُسجل كتسليم.' });
  return issues;
}

export function assertPaymentAllowed(state, project, nextAmount, currentPaymentId = null) {
  const price = amount(project.pricePerVideo);
  const total = amount(project.totalVideos);
  const value = price * total;
  if (nextAmount <= 0) throw new Error('Payment amount must be greater than zero');
  if (price <= 0) throw new Error('Set the video price before recording a payment');
  const { paid } = projectLedger(state, project.id, { excludePaymentId: currentPaymentId });
  if (total > 0 && paid + nextAmount > value) throw new Error(`Payment exceeds the remaining project value (${money(Math.max(value - paid, 0))})`);
}

export function assertDeliveryAllowed(state, project, nextQuantity, currentDeliveryId = null) {
  const total = amount(project.totalVideos);
  const price = amount(project.pricePerVideo);
  if (nextQuantity < 1) throw new Error('Delivery quantity must be at least 1');
  const { paid, delivered } = projectLedger(state, project.id, { excludeDeliveryId: currentDeliveryId });
  if (total > 0) {
    if (delivered + nextQuantity > total) throw new Error(`Delivery exceeds the remaining videos (${Math.max(total - delivered, 0)})`);
    return;
  }
  if (price <= 0) throw new Error('Set the video price before recording a delivery');
  const fundedVideos = Math.floor(paid / price);
  if (delivered + nextQuantity > fundedVideos) {
    throw new Error(`Delivery exceeds the prepaid balance (${Math.max(fundedVideos - delivered, 0)} funded videos left)`);
  }
}

export function assertProjectChangeAllowed(state, project, patch) {
  const totalVideos = patch.totalVideos ?? project.totalVideos;
  const pricePerVideo = patch.pricePerVideo ?? project.pricePerVideo;
  const status = patch.status ?? project.status;
  const { paid, delivered } = projectLedger(state, project.id);
  const total = Number(totalVideos) || 0;
  const price = Number(pricePerVideo) || 0;
  if (price <= 0 && (paid > 0 || delivered > 0)) throw new Error('Video price is required while the project has payments or deliveries');
  if (total > 0 && total < delivered) throw new Error(`Total videos cannot be less than the ${delivered} already delivered`);
  if (total > 0 && total * price < paid) throw new Error(`Project value cannot be less than the ${money(paid)} already paid`);
  if (total === 0 && delivered * price > paid) throw new Error('The prepaid balance must cover all delivered videos before using an open total');
  if (total > 0 && status === 'completed' && delivered < total) throw new Error('Record all video deliveries before completing the project');
}

function money(value) { return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value) || 0); }
