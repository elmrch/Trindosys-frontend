export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  companyId: number | null;
  companyName: string | null;
  status: string;
  sourceCampaign: string | null;
  notes: string | null;
  advisorId: number | null;
  advisorName: string | null;
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
  companyId: number | null;
  sourceCampaign: string | null;
  notes: string | null;
  advisorId: number | null;
}

export interface UpdateCustomerTagsRequest {
  tags: string[];
}
