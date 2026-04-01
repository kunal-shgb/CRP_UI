export type TicketStatus = "PENDING_AT_RO" | "ESCALATED_TO_HEAD_OFFICE" | "CLOSED";
export type QrCodeStatus = "PENDING_QR_GENERATION" | "AVAILABLE_FOR_DOWNLOAD";
export type ProductType = "IMPS" | "AEPS" | "UPI" | "ATM" | "NEFT" | "RTGS" | "QR_CODE";
export type UserRole = "BRANCH" | "REGIONAL_OFFICE" | "HEAD_OFFICE" | "ADMIN";


export const PRODUCTS: ProductType[] = ["IMPS", "AEPS", "UPI", "ATM", "NEFT", "RTGS"];

export function getStatusColor(status: TicketStatus | QrCodeStatus): string {
  switch (status) {
    case "PENDING_AT_RO": return "bg-amber-100 text-amber-800";
    case "ESCALATED_TO_HEAD_OFFICE": return "bg-orange-100 text-orange-800";
    case "CLOSED": return "bg-muted text-muted-foreground";
    case "PENDING_QR_GENERATION": return "bg-amber-100 text-amber-800";
    case "AVAILABLE_FOR_DOWNLOAD": return "bg-emerald-100 text-emerald-800";
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
