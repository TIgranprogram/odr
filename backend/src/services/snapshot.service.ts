import { RequisitionSnapshot, IRequisitionSnapshot } from '../models/RequisitionSnapshot';
import { IRequisition } from '../models/Requisition';
import { DEFAULT_ORGANIZATION_ID } from '../utils/tenant';

/**
 * T-6.2: снимки заявок при переходах статуса. Снимок создаётся из актуального
 * состояния заявки ПОСЛЕ смены статуса (снимок фиксирует новый статус и
 * копию ключевых полей); последующие правки заявки снимок не меняют.
 */

export interface CaptureContext {
  /** Статус до перехода */
  previousStatus?: string;
  /** Кто совершил переход (username из JWT) */
  capturedBy?: string;
  organizationId?: string;
}

export const captureForRequisition = async (
  requisition: IRequisition,
  context: CaptureContext = {}
): Promise<IRequisitionSnapshot> => {
  const priceWithVat = Number(requisition.priceWithVat) || 0;
  const quantity = Number(requisition.quantity) || 0;

  return await RequisitionSnapshot.create({
    requisitionId: requisition._id,
    previousStatus: context.previousStatus,
    status: requisition.status,
    itemName: requisition.itemName,
    sku: requisition.sku,
    unit: requisition.unit,
    category: requisition.category,
    company: requisition.company,
    priority: requisition.priority,
    customer: requisition.customer,
    supplier: requisition.supplier,
    color: requisition.color,
    link: requisition.link,
    note: requisition.note,
    quantity,
    priceWithVat,
    lineTotal: priceWithVat * quantity,
    requestedBy: requisition.requestedBy,
    date: requisition.date,
    orderRef: requisition.orderRef,
    invoiceRef: requisition.invoiceRef,
    capturedBy: context.capturedBy,
    organizationId: context.organizationId || requisition.organizationId || DEFAULT_ORGANIZATION_ID,
  });
};

/** Список снимков заявки (новые сверху). */
export const listByRequisition = async (
  requisitionId: string
): Promise<IRequisitionSnapshot[]> => {
  return await RequisitionSnapshot.find({ requisitionId })
    .sort({ capturedAt: -1 })
    .exec();
};
