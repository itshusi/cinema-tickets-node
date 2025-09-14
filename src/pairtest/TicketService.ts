import TicketTypeRequest from './lib/TicketTypeRequest';
import InvalidPurchaseException from './lib/InvalidPurchaseException';

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  purchaseTickets(accountId, ...ticketTypeRequests) {
    // throws InvalidPurchaseException
  }
}
