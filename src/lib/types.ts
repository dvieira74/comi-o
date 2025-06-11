
export type ProductType = 'impressora' | 'toner';

export interface SaleEntry {
  id: string;
  date: string; // ISO string format date
  clientName: string;
  productType: ProductType;
  saleValue: number;
  commissionRate: number; // Stored as percentage, e.g., 10 for 10%
  commissionValue: number;
  printerModel?: string;
  servicePerformed?: string;
}
