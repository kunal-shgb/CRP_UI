export type TicketStatus = "Pending at RO" | "Pending at HO" | "Escalated to HO" | "Resolved" | "Closed";
export type ProductType = "IMPS" | "AEPS" | "UPI" | "ATM" | "NEFT" | "RTGS";
export type UserRole = "Branch" | "RO" | "HO" | "Admin";

export interface Ticket {
  id: string;
  utr: string;
  accountNumber: string;
  product: ProductType;
  description: string;
  status: TicketStatus;
  branch: string;
  regionalOffice: string;
  amount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  note?: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branch?: string;
  regionalOffice?: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

export const BRANCHES = [
  "Mumbai Central", "Delhi Connaught Place", "Bangalore MG Road",
  "Chennai Anna Nagar", "Kolkata Park Street", "Pune Shivaji Nagar",
  "Hyderabad Jubilee Hills", "Ahmedabad CG Road"
];

export const REGIONAL_OFFICES = [
  "RO Mumbai", "RO Delhi", "RO Bangalore", "RO Chennai"
];

export const BRANCH_RO_MAP: Record<string, string> = {
  "Mumbai Central": "RO Mumbai",
  "Pune Shivaji Nagar": "RO Mumbai",
  "Delhi Connaught Place": "RO Delhi",
  "Ahmedabad CG Road": "RO Delhi",
  "Bangalore MG Road": "RO Bangalore",
  "Hyderabad Jubilee Hills": "RO Bangalore",
  "Chennai Anna Nagar": "RO Chennai",
  "Kolkata Park Street": "RO Chennai",
};

const now = new Date();
const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString();

export const MOCK_TICKETS: Ticket[] = [
  {
    id: "T2024-08-001", utr: "422069019371", accountNumber: "1234567890", product: "IMPS",
    description: "Customer reports IMPS transfer of ₹2,450 debited from account but not credited to beneficiary. Transaction timed out during processing.",
    status: "Pending at RO", branch: "Mumbai Central", regionalOffice: "RO Mumbai", amount: 2450,
    createdBy: "Priya Sharma", createdAt: d(2), updatedAt: d(1), assignedTo: "Rajesh Kumar",
    auditTrail: [
      { id: "a1", timestamp: d(2), user: "Priya Sharma", role: "Branch", action: "Ticket Created", note: "Customer visited branch with transaction receipt." },
      { id: "a2", timestamp: d(1), user: "System", role: "Admin", action: "Auto-assigned to RO Mumbai" },
    ]
  },
  {
    id: "T2024-08-002", utr: "UPI0824153290", accountNumber: "9876543210", product: "UPI",
    description: "UPI payment of ₹15,000 to merchant failed but amount debited. Customer has screenshot of failed transaction.",
    status: "Escalated to HO", branch: "Delhi Connaught Place", regionalOffice: "RO Delhi", amount: 15000,
    createdBy: "Amit Verma", createdAt: d(5), updatedAt: d(1), assignedTo: "Sunita Reddy",
    auditTrail: [
      { id: "a3", timestamp: d(5), user: "Amit Verma", role: "Branch", action: "Ticket Created" },
      { id: "a4", timestamp: d(4), user: "System", role: "Admin", action: "Auto-assigned to RO Delhi" },
      { id: "a5", timestamp: d(3), user: "Meena Gupta", role: "RO", action: "Review Started", note: "Checked with NPCI. Transaction marked as deemed success at beneficiary bank." },
      { id: "a6", timestamp: d(1), user: "Meena Gupta", role: "RO", action: "Escalated to HO", note: "Beneficiary bank not responding to reversal request. Escalating for intervention." },
    ]
  },
  {
    id: "T2024-08-003", utr: "ATM0824091845", accountNumber: "5566778899", product: "ATM",
    description: "ATM cash withdrawal of ₹10,000 - cash not dispensed but account debited. ATM at Sector 15 branch.",
    status: "Resolved", branch: "Bangalore MG Road", regionalOffice: "RO Bangalore", amount: 10000,
    createdBy: "Karthik Nair", createdAt: d(8), updatedAt: d(2), assignedTo: "Deepak Joshi",
    auditTrail: [
      { id: "a7", timestamp: d(8), user: "Karthik Nair", role: "Branch", action: "Ticket Created" },
      { id: "a8", timestamp: d(7), user: "System", role: "Admin", action: "Auto-assigned to RO Bangalore" },
      { id: "a9", timestamp: d(5), user: "Deepak Joshi", role: "RO", action: "Investigation", note: "ATM journal checked. Cash retracted confirmed. EJ log attached." },
      { id: "a10", timestamp: d(2), user: "Deepak Joshi", role: "RO", action: "Resolved", note: "Amount of ₹10,000 reversed to customer account. Ref: REV20240822001." },
    ]
  },
  {
    id: "T2024-08-004", utr: "NEFT082412340", accountNumber: "1122334455", product: "NEFT",
    description: "NEFT transfer of ₹50,000 credited to wrong beneficiary account due to incorrect IFSC code entry by branch.",
    status: "Pending at HO", branch: "Chennai Anna Nagar", regionalOffice: "RO Chennai", amount: 50000,
    createdBy: "Lakshmi Iyer", createdAt: d(3), updatedAt: d(1), assignedTo: "Sunita Reddy",
    auditTrail: [
      { id: "a11", timestamp: d(3), user: "Lakshmi Iyer", role: "Branch", action: "Ticket Created", note: "Customer submitted written complaint with incorrect IFSC details." },
      { id: "a12", timestamp: d(2), user: "System", role: "Admin", action: "Auto-assigned to RO Chennai" },
      { id: "a13", timestamp: d(1), user: "Vijay Menon", role: "RO", action: "Escalated to HO", note: "Cross-bank recovery needed. Requires HO-level intervention with receiving bank." },
    ]
  },
  {
    id: "T2024-08-005", utr: "AEPS08241678", accountNumber: "6677889900", product: "AEPS",
    description: "AEPS withdrawal at CSP point - biometric authenticated but cash not given by agent. Amount ₹5,000 debited.",
    status: "Pending at RO", branch: "Kolkata Park Street", regionalOffice: "RO Chennai", amount: 5000,
    createdBy: "Sanjay Das", createdAt: d(1), updatedAt: d(1), assignedTo: "Vijay Menon",
    auditTrail: [
      { id: "a14", timestamp: d(1), user: "Sanjay Das", role: "Branch", action: "Ticket Created", note: "Customer complaint against CSP agent ID: CSP-KOL-234." },
    ]
  },
  {
    id: "T2024-08-006", utr: "RTGS08240098", accountNumber: "3344556677", product: "RTGS",
    description: "RTGS of ₹2,50,000 sent to beneficiary but marked as returned by receiving bank. Amount not re-credited.",
    status: "Closed", branch: "Pune Shivaji Nagar", regionalOffice: "RO Mumbai", amount: 250000,
    createdBy: "Anita Kulkarni", createdAt: d(15), updatedAt: d(5), assignedTo: "Rajesh Kumar",
    auditTrail: [
      { id: "a15", timestamp: d(15), user: "Anita Kulkarni", role: "Branch", action: "Ticket Created" },
      { id: "a16", timestamp: d(14), user: "System", role: "Admin", action: "Auto-assigned to RO Mumbai" },
      { id: "a17", timestamp: d(12), user: "Rajesh Kumar", role: "RO", action: "Investigation", note: "Receiving bank confirmed return. Checking with CBS team for credit." },
      { id: "a18", timestamp: d(8), user: "Rajesh Kumar", role: "RO", action: "Escalated to HO", note: "CBS team unable to locate return credit. Needs HO reconciliation." },
      { id: "a19", timestamp: d(6), user: "Sunita Reddy", role: "HO", action: "Resolution", note: "CBS reconciliation completed. Return credit of ₹2,50,000 posted to customer account. Ref: RET20240810001." },
      { id: "a20", timestamp: d(5), user: "Sunita Reddy", role: "HO", action: "Ticket Closed" },
    ]
  },
  {
    id: "T2024-08-007", utr: "UPI0824998877", accountNumber: "7788990011", product: "UPI",
    description: "Multiple UPI collect requests of ₹1,999 each debited without customer consent. Suspected fraud.",
    status: "Pending at RO", branch: "Hyderabad Jubilee Hills", regionalOffice: "RO Bangalore", amount: 5997,
    createdBy: "Ramesh Rao", createdAt: d(1), updatedAt: d(1), assignedTo: "Deepak Joshi",
    auditTrail: [
      { id: "a21", timestamp: d(1), user: "Ramesh Rao", role: "Branch", action: "Ticket Created", note: "Customer reports unauthorized collect requests. Fraud suspected. Account blocked as precaution." },
    ]
  },
  {
    id: "T2024-08-008", utr: "IMPS08247654", accountNumber: "4455667788", product: "IMPS",
    description: "IMPS transfer of ₹8,500 shows success on sender side but beneficiary denies receiving funds.",
    status: "Pending at RO", branch: "Ahmedabad CG Road", regionalOffice: "RO Delhi", amount: 8500,
    createdBy: "Paresh Patel", createdAt: d(0), updatedAt: d(0), assignedTo: "Meena Gupta",
    auditTrail: [
      { id: "a22", timestamp: d(0), user: "Paresh Patel", role: "Branch", action: "Ticket Created" },
    ]
  },
];

export const MOCK_USERS: AppUser[] = [
  { id: "u1", name: "Priya Sharma", email: "priya.sharma@bank.com", role: "Branch", branch: "Mumbai Central", regionalOffice: "RO Mumbai", status: "Active", createdAt: d(90) },
  { id: "u2", name: "Amit Verma", email: "amit.verma@bank.com", role: "Branch", branch: "Delhi Connaught Place", regionalOffice: "RO Delhi", status: "Active", createdAt: d(85) },
  { id: "u3", name: "Rajesh Kumar", email: "rajesh.kumar@bank.com", role: "RO", regionalOffice: "RO Mumbai", status: "Active", createdAt: d(120) },
  { id: "u4", name: "Meena Gupta", email: "meena.gupta@bank.com", role: "RO", regionalOffice: "RO Delhi", status: "Active", createdAt: d(110) },
  { id: "u5", name: "Deepak Joshi", email: "deepak.joshi@bank.com", role: "RO", regionalOffice: "RO Bangalore", status: "Active", createdAt: d(100) },
  { id: "u6", name: "Vijay Menon", email: "vijay.menon@bank.com", role: "RO", regionalOffice: "RO Chennai", status: "Active", createdAt: d(95) },
  { id: "u7", name: "Sunita Reddy", email: "sunita.reddy@bank.com", role: "HO", status: "Active", createdAt: d(150) },
  { id: "u8", name: "Admin User", email: "admin@bank.com", role: "Admin", status: "Active", createdAt: d(200) },
  { id: "u9", name: "Karthik Nair", email: "karthik.nair@bank.com", role: "Branch", branch: "Bangalore MG Road", regionalOffice: "RO Bangalore", status: "Active", createdAt: d(80) },
  { id: "u10", name: "Lakshmi Iyer", email: "lakshmi.iyer@bank.com", role: "Branch", branch: "Chennai Anna Nagar", regionalOffice: "RO Chennai", status: "Active", createdAt: d(75) },
  { id: "u11", name: "Sanjay Das", email: "sanjay.das@bank.com", role: "Branch", branch: "Kolkata Park Street", regionalOffice: "RO Chennai", status: "Inactive", createdAt: d(60) },
];

export const PRODUCTS: ProductType[] = ["IMPS", "AEPS", "UPI", "ATM", "NEFT", "RTGS"];

export function getStatusColor(status: TicketStatus): string {
  switch (status) {
    case "Pending at RO": return "bg-amber-100 text-amber-800";
    case "Pending at HO": return "bg-blue-100 text-blue-800";
    case "Escalated to HO": return "bg-orange-100 text-orange-800";
    case "Resolved": return "bg-emerald-100 text-emerald-800";
    case "Closed": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
}

export function getRoleColor(role: UserRole): string {
  switch (role) {
    case "Branch": return "bg-blue-100 text-blue-800";
    case "RO": return "bg-amber-100 text-amber-800";
    case "HO": return "bg-emerald-100 text-emerald-800";
    case "Admin": return "bg-purple-100 text-purple-800";
    default: return "bg-muted text-muted-foreground";
  }
}
