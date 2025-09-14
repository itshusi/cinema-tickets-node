import TicketService from '../../src/pairtest/TicketService';
import TicketTypeRequest from '../../src/pairtest/lib/TicketTypeRequest';
import InvalidPurchaseException from '../../src/pairtest/lib/InvalidPurchaseException';

// Create mock implementations
const mockMakePayment = jest.fn();
const mockReserveSeat = jest.fn();

const mockTicketPaymentService = {
  makePayment: mockMakePayment,
};

const mockSeatReservationService = {
  reserveSeat: mockReserveSeat,
};

describe('TicketService', () => {
  let ticketService: TicketService;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create service instance with mocked dependencies
    ticketService = new TicketService(
      mockTicketPaymentService,
      mockSeatReservationService
    );
  });

  describe('Account ID validation', () => {
    test('should throw InvalidPurchaseException for account ID of 0', () => {
      const adultTicket = new TicketTypeRequest('ADULT', 1);

      expect(() => {
        ticketService.purchaseTickets(0, adultTicket);
      }).toThrow(InvalidPurchaseException);
    });

    test('should throw InvalidPurchaseException for negative account ID', () => {
      const adultTicket = new TicketTypeRequest('ADULT', 1);

      expect(() => {
        ticketService.purchaseTickets(-1, adultTicket);
      }).toThrow(InvalidPurchaseException);
    });

    test('should throw InvalidPurchaseException for non-integer account ID', () => {
      const adultTicket = new TicketTypeRequest('ADULT', 1);

      expect(() => {
        ticketService.purchaseTickets(1.5, adultTicket);
      }).toThrow(InvalidPurchaseException);
    });

    test('should accept valid account ID greater than 0', () => {
      const adultTicket = new TicketTypeRequest('ADULT', 1);

      expect(() => {
        ticketService.purchaseTickets(1, adultTicket);
      }).not.toThrow();
    });
  });

  describe('Ticket quantity limits', () => {
    test('should throw InvalidPurchaseException when purchasing more than 25 tickets', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 26);

      expect(() => {
        ticketService.purchaseTickets(1, adultTickets);
      }).toThrow(InvalidPurchaseException);
    });

    test('should throw InvalidPurchaseException when total tickets across types exceed 25', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 10);
      const childTickets = new TicketTypeRequest('CHILD', 10);
      const infantTickets = new TicketTypeRequest('INFANT', 6);

      expect(() => {
        ticketService.purchaseTickets(
          1,
          adultTickets,
          childTickets,
          infantTickets
        );
      }).toThrow(InvalidPurchaseException);
    });

    test('should allow exactly 25 tickets', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 25);

      expect(() => {
        ticketService.purchaseTickets(1, adultTickets);
      }).not.toThrow();
    });

    test('should allow purchase with total tickets less than 25', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 10);
      const childTickets = new TicketTypeRequest('CHILD', 5);
      const infantTickets = new TicketTypeRequest('INFANT', 3);

      expect(() => {
        ticketService.purchaseTickets(
          1,
          adultTickets,
          childTickets,
          infantTickets
        );
      }).not.toThrow();
    });
  });

  describe('Adult ticket requirements', () => {
    test('should throw InvalidPurchaseException when purchasing child tickets without adult tickets', () => {
      const childTickets = new TicketTypeRequest('CHILD', 2);

      expect(() => {
        ticketService.purchaseTickets(1, childTickets);
      }).toThrow(InvalidPurchaseException);
    });

    test('should throw InvalidPurchaseException when purchasing infant tickets without adult tickets', () => {
      const infantTickets = new TicketTypeRequest('INFANT', 1);

      expect(() => {
        ticketService.purchaseTickets(1, infantTickets);
      }).toThrow(InvalidPurchaseException);
    });

    test('should throw InvalidPurchaseException when purchasing child and infant tickets without adult tickets', () => {
      const childTickets = new TicketTypeRequest('CHILD', 1);
      const infantTickets = new TicketTypeRequest('INFANT', 1);

      expect(() => {
        ticketService.purchaseTickets(1, childTickets, infantTickets);
      }).toThrow(InvalidPurchaseException);
    });

    test('should allow purchase of child tickets with adult tickets', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 1);
      const childTickets = new TicketTypeRequest('CHILD', 2);

      expect(() => {
        ticketService.purchaseTickets(1, adultTickets, childTickets);
      }).not.toThrow();
    });

    test('should allow purchase of infant tickets with adult tickets', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 1);
      const infantTickets = new TicketTypeRequest('INFANT', 1);

      expect(() => {
        ticketService.purchaseTickets(1, adultTickets, infantTickets);
      }).not.toThrow();
    });
  });

  describe('No tickets validation', () => {
    test('should throw InvalidPurchaseException when no tickets are requested', () => {
      expect(() => {
        ticketService.purchaseTickets(1);
      }).toThrow(InvalidPurchaseException);
    });

    test('should throw InvalidPurchaseException when ticket request has 0 tickets', () => {
      const zeroAdultTickets = new TicketTypeRequest('ADULT', 0);

      expect(() => {
        ticketService.purchaseTickets(1, zeroAdultTickets);
      }).toThrow(InvalidPurchaseException);
    });

    test('should throw InvalidPurchaseException when ticket request has negative tickets', () => {
      const negativeAdultTickets = new TicketTypeRequest('ADULT', -1);

      expect(() => {
        ticketService.purchaseTickets(1, negativeAdultTickets);
      }).toThrow(InvalidPurchaseException);
    });

    test('should throw InvalidPurchaseException when all ticket requests have 0 tickets', () => {
      const zeroAdultTickets = new TicketTypeRequest('ADULT', 0);
      const zeroChildTickets = new TicketTypeRequest('CHILD', 0);

      expect(() => {
        ticketService.purchaseTickets(1, zeroAdultTickets, zeroChildTickets);
      }).toThrow(InvalidPurchaseException);
    });
  });

  describe('Payment calculation and processing', () => {
    test('should calculate correct payment for adult tickets only', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 3);
      const expectedAmount = 3 * 25; // £25 per adult ticket

      ticketService.purchaseTickets(1, adultTickets);

      expect(mockMakePayment).toHaveBeenCalledWith(1, expectedAmount);
    });

    test('should calculate correct payment for child tickets with adult tickets', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 2);
      const childTickets = new TicketTypeRequest('CHILD', 3);
      const expectedAmount = 2 * 25 + 3 * 15; // £25 per adult + £15 per child

      ticketService.purchaseTickets(1, adultTickets, childTickets);

      expect(mockMakePayment).toHaveBeenCalledWith(1, expectedAmount);
    });

    test('should calculate correct payment when infant tickets are free', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 2);
      const infantTickets = new TicketTypeRequest('INFANT', 2);
      const expectedAmount = 2 * 25; // Only adult tickets charged, infants are free

      ticketService.purchaseTickets(1, adultTickets, infantTickets);

      expect(mockMakePayment).toHaveBeenCalledWith(1, expectedAmount);
    });

    test('should calculate correct payment for mixed ticket types', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 2);
      const childTickets = new TicketTypeRequest('CHILD', 3);
      const infantTickets = new TicketTypeRequest('INFANT', 1);
      const expectedAmount = 2 * 25 + 3 * 15 + 1 * 0; // £50 + £45 + £0

      ticketService.purchaseTickets(
        1,
        adultTickets,
        childTickets,
        infantTickets
      );

      expect(mockMakePayment).toHaveBeenCalledWith(1, expectedAmount);
    });

    test('should handle multiple ticket requests of the same type', () => {
      const adultTickets1 = new TicketTypeRequest('ADULT', 2);
      const adultTickets2 = new TicketTypeRequest('ADULT', 1);
      const expectedAmount = 3 * 25; // Total 3 adult tickets

      ticketService.purchaseTickets(1, adultTickets1, adultTickets2);

      expect(mockMakePayment).toHaveBeenCalledWith(1, expectedAmount);
    });

    test('should ensure payment amount is always an integer', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 1);

      ticketService.purchaseTickets(1, adultTickets);

      // Verify that the payment amount is an integer (as required by TicketPaymentService)
      expect(mockMakePayment).toHaveBeenCalledWith(1, expect.any(Number));
      const callArgs = mockMakePayment.mock.calls[0] as [number, number];
      expect(Number.isInteger(callArgs[1])).toBe(true);
    });
  });

  describe('Seat reservation', () => {
    test('should reserve correct number of seats for adults only', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 3);

      ticketService.purchaseTickets(1, adultTickets);

      expect(mockReserveSeat).toHaveBeenCalledWith(1, 3);
    });

    test('should reserve seats for adults and children but not infants', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 2);
      const childTickets = new TicketTypeRequest('CHILD', 2);
      const infantTickets = new TicketTypeRequest('INFANT', 1);

      ticketService.purchaseTickets(
        1,
        adultTickets,
        childTickets,
        infantTickets
      );

      expect(mockReserveSeat).toHaveBeenCalledWith(1, 4); // 2 adults + 2 children, no infants
    });

    test('should not reserve seats for infants only with adults', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 1);
      const infantTickets = new TicketTypeRequest('INFANT', 3);

      ticketService.purchaseTickets(1, adultTickets, infantTickets);

      expect(mockReserveSeat).toHaveBeenCalledWith(1, 1); // Only 1 adult seat
    });

    test('should handle multiple ticket requests correctly for seat calculation', () => {
      const adultTickets1 = new TicketTypeRequest('ADULT', 1);
      const adultTickets2 = new TicketTypeRequest('ADULT', 1);
      const childTickets = new TicketTypeRequest('CHILD', 2);

      ticketService.purchaseTickets(
        1,
        adultTickets1,
        adultTickets2,
        childTickets
      );

      expect(mockReserveSeat).toHaveBeenCalledWith(1, 4); // 2 adults + 2 children
    });

    test('should ensure seat count is always an integer', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 2);
      const childTickets = new TicketTypeRequest('CHILD', 1);

      ticketService.purchaseTickets(1, adultTickets, childTickets);

      // Verify that the seat count is an integer (as required by SeatReservationService)
      expect(mockReserveSeat).toHaveBeenCalledWith(1, expect.any(Number));
      const callArgs = mockReserveSeat.mock.calls[0] as [number, number];
      expect(Number.isInteger(callArgs[1])).toBe(true);
    });
  });

  describe('Service integration', () => {
    test('should call both payment and seat reservation services', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 2);
      const childTickets = new TicketTypeRequest('CHILD', 1);

      ticketService.purchaseTickets(1, adultTickets, childTickets);

      expect(mockMakePayment).toHaveBeenCalledTimes(1);
      expect(mockReserveSeat).toHaveBeenCalledTimes(1);
    });

    test('should call services with correct account ID', () => {
      const accountId = 12345;
      const adultTickets = new TicketTypeRequest('ADULT', 1);

      ticketService.purchaseTickets(accountId, adultTickets);

      expect(mockMakePayment).toHaveBeenCalledWith(
        accountId,
        expect.any(Number)
      );
      expect(mockReserveSeat).toHaveBeenCalledWith(
        accountId,
        expect.any(Number)
      );
    });
  });

  describe('Edge cases', () => {
    test('should handle single ticket purchase', () => {
      const adultTicket = new TicketTypeRequest('ADULT', 1);

      expect(() => {
        ticketService.purchaseTickets(1, adultTicket);
      }).not.toThrow();

      expect(mockMakePayment).toHaveBeenCalledWith(1, 25);
      expect(mockReserveSeat).toHaveBeenCalledWith(1, 1);
    });

    test('should handle maximum valid purchase (25 tickets)', () => {
      const adultTickets = new TicketTypeRequest('ADULT', 20);
      const childTickets = new TicketTypeRequest('CHILD', 5);

      expect(() => {
        ticketService.purchaseTickets(1, adultTickets, childTickets);
      }).not.toThrow();

      expect(mockMakePayment).toHaveBeenCalledWith(1, 20 * 25 + 5 * 15);
      expect(mockReserveSeat).toHaveBeenCalledWith(1, 25);
    });

    test('should handle large account ID', () => {
      const largeAccountId = 999999999;
      const adultTicket = new TicketTypeRequest('ADULT', 1);

      expect(() => {
        ticketService.purchaseTickets(largeAccountId, adultTicket);
      }).not.toThrow();

      expect(mockMakePayment).toHaveBeenCalledWith(largeAccountId, 25);
      expect(mockReserveSeat).toHaveBeenCalledWith(largeAccountId, 1);
    });
  });

  describe('Complex scenarios', () => {
    test('should handle family purchase scenario', () => {
      // Family of 2 adults, 2 children, 1 infant
      const adultTickets = new TicketTypeRequest('ADULT', 2);
      const childTickets = new TicketTypeRequest('CHILD', 2);
      const infantTickets = new TicketTypeRequest('INFANT', 1);

      ticketService.purchaseTickets(
        1,
        adultTickets,
        childTickets,
        infantTickets
      );

      // Payment: 2 adults (£50) + 2 children (£30) + 1 infant (£0) = £80
      expect(mockMakePayment).toHaveBeenCalledWith(1, 80);

      // Seats: 2 adults + 2 children = 4 seats (infant sits on adult's lap)
      expect(mockReserveSeat).toHaveBeenCalledWith(1, 4);
    });

    test('should handle nursery group scenario', () => {
      // 3 adults supervising 8 infants
      const adultTickets = new TicketTypeRequest('ADULT', 3);
      const infantTickets = new TicketTypeRequest('INFANT', 8);

      ticketService.purchaseTickets(1, adultTickets, infantTickets);

      // Payment: 3 adults (£75) + 8 infants (£0) = £75
      expect(mockMakePayment).toHaveBeenCalledWith(1, 75);

      // Seats: 3 adults only = 3 seats
      expect(mockReserveSeat).toHaveBeenCalledWith(1, 3);
    });

    test('should handle school trip scenario', () => {
      // 2 adults with 10 children
      const adultTickets = new TicketTypeRequest('ADULT', 2);
      const childTickets = new TicketTypeRequest('CHILD', 10);

      ticketService.purchaseTickets(1, adultTickets, childTickets);

      // Payment: 2 adults (£50) + 10 children (£150) = £200
      expect(mockMakePayment).toHaveBeenCalledWith(1, 200);

      // Seats: 2 adults + 10 children = 12 seats
      expect(mockReserveSeat).toHaveBeenCalledWith(1, 12);
    });
  });
});
