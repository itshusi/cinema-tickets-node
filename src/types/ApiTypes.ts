import { TicketType } from "./TicketTypes.js";

export interface TicketItem {
  type: "ADULT" | "CHILD" | "INFANT";
  quantity: number;
}

export interface TicketPurchaseRequestBody {
  accountId: number;
  tickets: TicketItem[];
}

export interface TicketSummary {
  type: TicketType;
  quantity: number;
  price: number;
}

export interface SuccessResponse {
  success: true;
  data: {
    accountId: number;
    totalAmount: number;
    totalSeats: number;
    tickets: TicketSummary[];
    timestamp: string;
  };
}

export interface ErrorDetails {
  [key: string]: string | number | boolean;
}

export interface ErrorResponse {
  success: false;
  error: {
    type: string;
    code: string;
    message: string;
    timestamp: string;
    details?: ErrorDetails | undefined;
  };
}
