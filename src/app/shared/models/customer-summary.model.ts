export interface CustomerSummary {
  id: number;
  name: string;
  phone: string;
  blocked: boolean;
  company?: string | null;
  isNew?: boolean;
}
