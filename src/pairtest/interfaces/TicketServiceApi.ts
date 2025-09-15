import type TicketTypeRequest from "../lib/TicketTypeRequest";
import type { TicketCounts } from "../../types/TicketTypes";

/**
 * Purchase result containing transaction details
 */
export interface PurchaseResult {
  accountId: number;
  totalAmount: number;
  totalSeats: number;
  ticketCounts: TicketCounts;
}

/**
 * API contract for cinema ticket purchasing service
 *
 * This service handles the complete ticket purchasing workflow including:
 * - Account validation
 * - Business rule enforcement
 * - Payment processing
 * - Seat reservation
 *
 * @example
 * ```typescript
 * const ticketService = new TicketService(paymentService, seatService);
 *
 * try {
 *   ticketService.purchaseTickets(
 *     12345,
 *     new TicketTypeRequest('ADULT', 2),
 *     new TicketTypeRequest('CHILD', 1)
 *   );
 *   console.log('Tickets purchased successfully!');
 * } catch (error) {
 *   console.error('Purchase failed:', error.message);
 * }
 * ```
 */
export interface TicketPurchaseService {
  /**
   * Purchase cinema tickets for a specific account
   *
   * @param accountId - Valid account identifier (positive integer)
   * @param ticketRequests - One or more ticket requests specifying type and quantity
   *
   * @throws {InvalidPurchaseException} When:
   * - Account ID is invalid (non-positive, non-integer)
   * - No ticket requests provided
   * - Individual ticket quantities are invalid
   * - Total tickets exceed maximum limit (25)
   * - Child/Infant tickets requested without Adult supervision
   * - Payment processing fails
   * - Seat reservation fails
   *
   * @example
   * ```typescript
   * // Valid purchase
   * await service.purchaseTickets(
   *   12345,
   *   new TicketTypeRequest('ADULT', 2),
   *   new TicketTypeRequest('CHILD', 1),
   *   new TicketTypeRequest('INFANT', 1)
   * );
   *
   * // Invalid - no adult supervision
   * await service.purchaseTickets(
   *   12345,
   *   new TicketTypeRequest('CHILD', 2)
   * ); // throws InvalidPurchaseException
   * ```
   */
  purchaseTickets(accountId: number, ...ticketRequests: TicketTypeRequest[]): void | Promise<void> | Promise<PurchaseResult>;
}

/**
 * External payment processing service contract
 *
 * Implementation should handle payment gateway integration
 * and throw meaningful errors for payment failures
 */
export interface PaymentProcessingService {
  /**
   * Process payment for ticket purchase
   *
   * @param accountId - Account to charge
   * @param totalAmountToPay - Amount in pence (e.g., 2500 = £25.00)
   *
   * @throws When payment processing fails
   */
  makePayment(accountId: number, totalAmountToPay: number): void | Promise<void>;
}

/**
 * External seat reservation service contract
 *
 * Implementation should handle seat allocation
 * and throw meaningful errors for reservation failures
 */
export interface SeatAllocationService {
  /**
   * Reserve seats for ticket purchase
   *
   * Note: Infant tickets do not require seat reservations
   * as infants sit on adult laps
   *
   * @param accountId - Account making the reservation
   * @param totalSeatsToAllocate - Number of seats to reserve
   *
   * @throws When seat reservation fails
   */
  reserveSeat(accountId: number, totalSeatsToAllocate: number): void | Promise<void>;
}

/**
 * Business rules and constraints for ticket purchasing
 */
export interface TicketPurchaseConstraints {
  /** Maximum number of tickets that can be purchased in a single transaction */
  readonly MAX_TICKETS_PER_PURCHASE: number;

  /** Whether Child and Infant tickets require Adult supervision */
  readonly REQUIRES_ADULT_SUPERVISION: boolean;

  /** Whether Infant tickets require separate seats */
  readonly INFANTS_REQUIRE_SEATS: boolean;
}

/**
 * Pricing information for different ticket types
 */
export interface TicketPricingInfo {
  /** Adult ticket price in pence */
  readonly ADULT_PRICE: number;

  /** Child ticket price in pence */
  readonly CHILD_PRICE: number;

  /** Infant ticket price in pence (typically 0) */
  readonly INFANT_PRICE: number;
}
