
export interface TContact {
  id?: string;
  phone: string;
  name?: string;
  address?: string;
  subscribed?: boolean;
  createdAt?: Date;
  deletedAt?: Date;
  brgyCode?: string;
  regCode?: string;
  provCode?: string;
  citymunCode?: string;
  brgyDesc?: string;
  regDesc?: string;
  provDesc?: string;
  citymunDesc?: string;
  activePreset?: string;
  otpCode?: string;
  userLevel: "regional" | "provincial" | "municipal" | "barangay" | "admin" | "normal";
}
