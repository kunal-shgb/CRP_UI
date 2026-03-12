export type TicketStatus = "Pending at Regional Office" | "Pending at Head Office" | "Escalated to Head Office" | "Resolved" | "Closed";
export type ProductType = "IMPS" | "AEPS" | "UPI" | "ATM" | "NEFT" | "RTGS";
export type UserRole = "BRANCH" | "REGIONAL_OFFICE" | "HEAD_OFFICE" | "ADMIN";




export const PRODUCTS: ProductType[] = ["IMPS", "AEPS", "UPI", "ATM", "NEFT", "RTGS"];

export function getStatusColor(status: TicketStatus): string {
  switch (status) {
    case "Pending at Regional Office": return "bg-amber-100 text-amber-800";
    case "Pending at Head Office": return "bg-blue-100 text-blue-800";
    case "Escalated to Head Office": return "bg-orange-100 text-orange-800";
    case "Resolved": return "bg-emerald-100 text-emerald-800";
    case "Closed": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
}

export function getRoleColor(role: UserRole): string {
  switch (role) {
    case "BRANCH": return "bg-blue-100 text-blue-800";
    case "REGIONAL_OFFICE": return "bg-amber-100 text-amber-800";
    case "HEAD_OFFICE": return "bg-emerald-100 text-emerald-800";
    case "ADMIN": return "bg-purple-100 text-purple-800";
    default: return "bg-muted text-muted-foreground";
  }
}
