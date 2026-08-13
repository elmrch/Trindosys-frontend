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
  createdBy: number | null;
  updatedAt: string | null;
  updatedBy: number | null;
  lastInteractionAt: string | null;
  tags: string[];
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

export interface UpdateCustomerTagsRequest {
  tags: string[];
}
