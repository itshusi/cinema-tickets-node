import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import { TicketType, TicketCounts, BUSINESS_RULES, TICKET_PRICES } from "../types/TicketTypes.js";
import { TicketPurchaseService, PaymentProcessingService, SeatAllocationService } from "./interfaces/TicketServiceApi.js";

export default class TicketService implements TicketPurchaseService {
  private readonly paymentProcessor: PaymentProcessingService;
  private readonly seatManager: SeatAllocationService;

  constructor(paymentProcessor: PaymentProcessingService, seatManager: SeatAllocationService) {
    this.paymentProcessor = paymentProcessor;
    this.seatManager = seatManager;
  }

  async purchaseTickets(accountId: number, ...ticketRequests: TicketTypeRequest[]): Promise<void> {
    this.ensureValidAccountId(accountId);
    this.ensureValidTicketRequests(ticketRequests);

    const ticketCounts = this.aggregateTicketQuantitiesByType(ticketRequests);
    this.enforceBusinessRules(ticketCounts);

    const paymentAmount = this.calculateTotalCost(ticketCounts);
    const requiredSeats = this.calculateSeatsNeeded(ticketCounts);

    await this.executePaymentTransaction(accountId, paymentAmount);
    await this.executeSeatReservation(accountId, requiredSeats);
  }

  private ensureValidAccountId(accountId: number): void {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException(`Invalid account ID: ${accountId}. Account ID must be a positive integer greater than 0`);
    }
  }

  private ensureValidTicketRequests(ticketRequests: TicketTypeRequest[]): void {
    if (!ticketRequests || ticketRequests.length === 0) {
      throw new InvalidPurchaseException("At least one ticket must be requested");
    }

    ticketRequests.forEach(this.ensureSingleTicketRequestIsValid);
  }

  private readonly ensureSingleTicketRequestIsValid = (request: TicketTypeRequest): void => {
    if (!request) {
      throw new InvalidPurchaseException("Invalid ticket request: null or undefined ticket request provided");
    }

    const quantity = request.getNoOfTickets();
    const ticketType = request.getTicketType();

    if (quantity <= 0) {
      throw new InvalidPurchaseException(`Invalid quantity for ${ticketType} tickets: ${quantity}. Quantity must be greater than 0`);
    }
  };

  private aggregateTicketQuantitiesByType(ticketRequests: TicketTypeRequest[]): TicketCounts {
    const counts: TicketCounts = {
      [TicketType.ADULT]: 0,
      [TicketType.CHILD]: 0,
      [TicketType.INFANT]: 0,
    };

    for (const request of ticketRequests) {
      const ticketType = request.getTicketType() as TicketType;
      const quantity = request.getNoOfTickets();
      counts[ticketType] += quantity;
    }

    return counts;
  }

  private enforceBusinessRules(ticketCounts: TicketCounts): void {
    this.ensureTicketLimitNotExceeded(ticketCounts);
    this.ensureAtLeastOneTicketPurchased(ticketCounts);
    this.ensureAdultSupervisionRequirement(ticketCounts);
  }

  private ensureTicketLimitNotExceeded(ticketCounts: TicketCounts): void {
    const totalTickets = this.calculateTotalTicketCount(ticketCounts);

    if (totalTickets > BUSINESS_RULES.MAX_TICKETS_PER_PURCHASE) {
      throw new InvalidPurchaseException(
        `Cannot purchase more than ${BUSINESS_RULES.MAX_TICKETS_PER_PURCHASE} tickets at a time. Requested: ${totalTickets} tickets`
      );
    }
  }

  private ensureAtLeastOneTicketPurchased(ticketCounts: TicketCounts): void {
    const totalTickets = this.calculateTotalTicketCount(ticketCounts);

    if (totalTickets === 0) {
      throw new InvalidPurchaseException("Must purchase at least one ticket");
    }
  }

  private ensureAdultSupervisionRequirement(ticketCounts: TicketCounts): void {
    const hasChildrenOrInfants = ticketCounts[TicketType.CHILD] > 0 || ticketCounts[TicketType.INFANT] > 0;
    const hasAdults = ticketCounts[TicketType.ADULT] > 0;

    if (hasChildrenOrInfants && !hasAdults) {
      const errorDetails = this.buildSupervisionErrorDetails(ticketCounts);
      throw new InvalidPurchaseException(
        `Child and Infant tickets require at least one Adult ticket. Attempted to purchase: ${errorDetails} without any Adult tickets`
      );
    }
  }

  private buildSupervisionErrorDetails(ticketCounts: TicketCounts): string {
    const details = [];

    if (ticketCounts[TicketType.CHILD] > 0) {
      details.push(`${ticketCounts[TicketType.CHILD]} Child ticket(s)`);
    }
    if (ticketCounts[TicketType.INFANT] > 0) {
      details.push(`${ticketCounts[TicketType.INFANT]} Infant ticket(s)`);
    }

    return details.join(" and ");
  }

  private calculateTotalTicketCount(ticketCounts: TicketCounts): number {
    return ticketCounts[TicketType.ADULT] + ticketCounts[TicketType.CHILD] + ticketCounts[TicketType.INFANT];
  }

  private calculateTotalCost(ticketCounts: TicketCounts): number {
    return (
      ticketCounts[TicketType.ADULT] * TICKET_PRICES[TicketType.ADULT] +
      ticketCounts[TicketType.CHILD] * TICKET_PRICES[TicketType.CHILD] +
      ticketCounts[TicketType.INFANT] * TICKET_PRICES[TicketType.INFANT]
    );
  }

  private calculateSeatsNeeded(ticketCounts: TicketCounts): number {
    return ticketCounts[TicketType.ADULT] + ticketCounts[TicketType.CHILD];
  }

  private async executePaymentTransaction(accountId: number, amount: number): Promise<void> {
    try {
      await this.paymentProcessor.makePayment(accountId, amount);
    } catch (error) {
      throw new InvalidPurchaseException(`Payment processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private async executeSeatReservation(accountId: number, seatCount: number): Promise<void> {
    if (seatCount > 0) {
      try {
        await this.seatManager.reserveSeat(accountId, seatCount);
      } catch (error) {
        throw new InvalidPurchaseException(`Seat reservation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  }
}
