import TicketTypeRequest from './lib/TicketTypeRequest';
import InvalidPurchaseException from './lib/InvalidPurchaseException';

export default class TicketService {
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

    // TODO: Implement remaining business logic
    console.log(
      'Validation passed for:',
      ticketTypeRequests.length,
      'requests'
    );
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
}
