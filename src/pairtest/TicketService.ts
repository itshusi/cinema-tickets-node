import TicketTypeRequest from './lib/TicketTypeRequest';
import InvalidPurchaseException from './lib/InvalidPurchaseException';
import {
  TicketType,
  TicketCounts,
  BUSINESS_RULES,
  TICKET_PRICES,
} from '../types/TicketTypes';

interface PaymentService {
  makePayment(accountId: number, totalAmountToPay: number): void;
}

interface SeatReservationServiceInterface {
  reserveSeat(accountId: number, totalSeatsToAllocate: number): void;
}

export default class TicketService {
  private readonly ticketPaymentService: PaymentService;
  private readonly seatReservationService: SeatReservationServiceInterface;

  constructor(
    ticketPaymentService: PaymentService,
    seatReservationService: SeatReservationServiceInterface
  ) {
    this.ticketPaymentService = ticketPaymentService;
    this.seatReservationService = seatReservationService;
  }

  /**
   * Should only have private methods other than the one below.
   */

  purchaseTickets(
    accountId: number,
    ...ticketTypeRequests: TicketTypeRequest[]
  ): void {
    // throws InvalidPurchaseException
    this.validateAccountId(accountId);
    this.validateTicketRequests(ticketTypeRequests);

    const ticketCounts = this.calculateTicketCounts(ticketTypeRequests);
    this.validateBusinessRules(ticketCounts);

    const totalAmount = this.calculateTotalPaymentAmount(ticketCounts);
    const totalSeats = this.calculateTotalSeatsToReserve(ticketCounts);

    this.processPayment(accountId, totalAmount);
    this.reserveSeats(accountId, totalSeats);
  }

  private validateAccountId(accountId: number): void {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException(
        'Account ID must be a positive integer'
      );
    }
  }

  private validateTicketRequests(
    ticketTypeRequests: TicketTypeRequest[]
  ): void {
    if (!ticketTypeRequests || ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException(
        'At least one ticket must be requested'
      );
    }

    for (const request of ticketTypeRequests) {
      if (!request || request.getNoOfTickets() <= 0) {
        throw new InvalidPurchaseException(
          'All ticket requests must have a positive quantity'
        );
      }
    }
  }

  private calculateTicketCounts(
    ticketTypeRequests: TicketTypeRequest[]
  ): TicketCounts {
    const counts: TicketCounts = {
      [TicketType.ADULT]: 0,
      [TicketType.CHILD]: 0,
      [TicketType.INFANT]: 0,
    };

    for (const request of ticketTypeRequests) {
      const ticketType = request.getTicketType() as TicketType;
      const quantity = request.getNoOfTickets();
      counts[ticketType] += quantity;
    }

    return counts;
  }

  private validateBusinessRules(ticketCounts: TicketCounts): void {
    const totalTickets =
      ticketCounts[TicketType.ADULT] +
      ticketCounts[TicketType.CHILD] +
      ticketCounts[TicketType.INFANT];

    if (totalTickets > BUSINESS_RULES.MAX_TICKETS_PER_PURCHASE) {
      throw new InvalidPurchaseException(
        'Cannot purchase more than 25 tickets at a time'
      );
    }

    if (totalTickets === 0) {
      throw new InvalidPurchaseException('Must purchase at least one ticket');
    }

    if (
      (ticketCounts[TicketType.CHILD] > 0 ||
        ticketCounts[TicketType.INFANT] > 0) &&
      ticketCounts[TicketType.ADULT] === 0
    ) {
      throw new InvalidPurchaseException(
        'Child and Infant tickets cannot be purchased without Adult tickets'
      );
    }
  }

  private calculateTotalPaymentAmount(ticketCounts: TicketCounts): number {
    return (
      ticketCounts[TicketType.ADULT] * TICKET_PRICES[TicketType.ADULT] +
      ticketCounts[TicketType.CHILD] * TICKET_PRICES[TicketType.CHILD] +
      ticketCounts[TicketType.INFANT] * TICKET_PRICES[TicketType.INFANT]
    );
  }

  private calculateTotalSeatsToReserve(ticketCounts: TicketCounts): number {
    // Infants sit on adult laps, so they don't need seats
    return ticketCounts[TicketType.ADULT] + ticketCounts[TicketType.CHILD];
  }

  private processPayment(accountId: number, totalAmount: number): void {
    try {
      this.ticketPaymentService.makePayment(accountId, totalAmount);
    } catch (error) {
      throw new InvalidPurchaseException(
        `Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private reserveSeats(accountId: number, totalSeats: number): void {
    if (totalSeats > 0) {
      try {
        this.seatReservationService.reserveSeat(accountId, totalSeats);
      } catch (error) {
        throw new InvalidPurchaseException(
          `Seat reservation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }
}
