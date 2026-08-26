export interface CustomerSummary {
  id: number;
  name: string;
  phone: string;
  blocked: boolean;
  companyId?: number | null;
  companyName?: string | null;
  isNew?: boolean;
}
