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

    // TODO: Implement remaining validation and business logic
    console.log('Tickets requested:', ticketTypeRequests.length);
  }

  private validateAccountId(accountId: number): void {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException(
        'Account ID must be a positive integer'
      );
    }
  }
}
