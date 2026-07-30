export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  sourceCampaign: string | null;
  notes: string | null;
  advisorId: number | null;
  createdAt: string;
  lastInteractionAt: string | null;
}

export interface CustomerRequest {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  sourceCampaign: string | null;
  notes: string | null;
  advisorId: number | null;
}
