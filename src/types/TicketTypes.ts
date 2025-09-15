/**
 * Supported ticket types for cinema booking system
 */
export enum TicketType {
  ADULT = "ADULT",
  CHILD = "CHILD",
  INFANT = "INFANT",
}

/**
 * Ticket pricing structure
 */
export const TICKET_PRICES: Record<TicketType, number> = {
  [TicketType.ADULT]: 25,
  [TicketType.CHILD]: 15,
  [TicketType.INFANT]: 0,
} as const;

/**
 * Type for ticket counts by type
 */
export interface TicketCounts {
  [TicketType.ADULT]: number;
  [TicketType.CHILD]: number;
  [TicketType.INFANT]: number;
}

/**
 * Business rule constants
 */
export const BUSINESS_RULES = {
  MAX_TICKETS_PER_PURCHASE: 25,
  MIN_TICKETS_PER_PURCHASE: 1,
} as const;
