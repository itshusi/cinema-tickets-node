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
    // Implementation will be added after tests are written
    if (accountId <= 0) {
      throw new InvalidPurchaseException('Invalid account ID');
    }
    console.log(ticketTypeRequests);
  }
}
