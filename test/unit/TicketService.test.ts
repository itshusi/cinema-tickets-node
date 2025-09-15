import TicketService from "../../src/pairtest/TicketService";
import TicketTypeRequest from "../../src/pairtest/lib/TicketTypeRequest";
import InvalidPurchaseException from "../../src/pairtest/lib/InvalidPurchaseException";

// Create mock implementations
const mockMakePayment = jest.fn();
const mockReserveSeat = jest.fn();

const mockTicketPaymentService = {
  makePayment: mockMakePayment,
};

const mockSeatReservationService = {
  reserveSeat: mockReserveSeat,
};

describe("TicketService", () => {
  let ticketService: TicketService;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create service instance with mocked dependencies
    ticketService = new TicketService(mockTicketPaymentService, mockSeatReservationService);
  });

  describe("Account ID validation", () => {
    test("should throw InvalidPurchaseException for account ID of 0", async () => {
      const adultTicket = new TicketTypeRequest("ADULT", 1);
      await expect(ticketService.purchaseTickets(0, adultTicket)).rejects.toThrow(InvalidPurchaseException);
    });

    test("should throw InvalidPurchaseException for negative account ID", async () => {
      const adultTicket = new TicketTypeRequest("ADULT", 1);
      await expect(ticketService.purchaseTickets(-1, adultTicket)).rejects.toThrow(InvalidPurchaseException);
    });

    test("should throw InvalidPurchaseException for non-integer account ID", async () => {
      const adultTicket = new TicketTypeRequest("ADULT", 1);
      await expect(ticketService.purchaseTickets(1.5, adultTicket)).rejects.toThrow(InvalidPurchaseException);
    });

    test("should accept valid account ID greater than 0", async () => {
      const adultTicket = new TicketTypeRequest("ADULT", 1);
      await expect(ticketService.purchaseTickets(1, adultTicket)).resolves.not.toThrow();
    });
  });

  describe("Ticket quantity limits", () => {
    test("should throw InvalidPurchaseException when purchasing more than 25 tickets", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 26);
      await expect(ticketService.purchaseTickets(1, adultTickets)).rejects.toThrow(InvalidPurchaseException);
    });

    test("should throw InvalidPurchaseException when total tickets across types exceed 25", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 10);
      const childTickets = new TicketTypeRequest("CHILD", 10);
      const infantTickets = new TicketTypeRequest("INFANT", 6);
      await expect(ticketService.purchaseTickets(1, adultTickets, childTickets, infantTickets)).rejects.toThrow(InvalidPurchaseException);
    });

    test("should allow exactly 25 tickets", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 25);
      await expect(ticketService.purchaseTickets(1, adultTickets)).resolves.not.toThrow();
    });

    test("should allow purchase with total tickets less than 25", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 10);
      const childTickets = new TicketTypeRequest("CHILD", 5);
      const infantTickets = new TicketTypeRequest("INFANT", 3);
      await expect(ticketService.purchaseTickets(1, adultTickets, childTickets, infantTickets)).resolves.not.toThrow();
    });
  });

  describe("Adult ticket requirements", () => {
    test("should throw InvalidPurchaseException when purchasing child tickets without adult tickets", async () => {
      const childTickets = new TicketTypeRequest("CHILD", 2);
      await expect(ticketService.purchaseTickets(1, childTickets)).rejects.toThrow(InvalidPurchaseException);
    });

    test("should throw InvalidPurchaseException when purchasing infant tickets without adult tickets", async () => {
      const infantTickets = new TicketTypeRequest("INFANT", 1);
      await expect(ticketService.purchaseTickets(1, infantTickets)).rejects.toThrow(InvalidPurchaseException);
    });

    test("should throw InvalidPurchaseException when purchasing child and infant tickets without adult tickets", async () => {
      const childTickets = new TicketTypeRequest("CHILD", 1);
      const infantTickets = new TicketTypeRequest("INFANT", 1);
      await expect(ticketService.purchaseTickets(1, childTickets, infantTickets)).rejects.toThrow(InvalidPurchaseException);
    });

    test("should allow purchase of child tickets with adult tickets", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 1);
      const childTickets = new TicketTypeRequest("CHILD", 2);
      await expect(ticketService.purchaseTickets(1, adultTickets, childTickets)).resolves.not.toThrow();
    });

    test("should allow purchase of infant tickets with adult tickets", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 1);
      const infantTickets = new TicketTypeRequest("INFANT", 1);
      await expect(ticketService.purchaseTickets(1, adultTickets, infantTickets)).resolves.not.toThrow();
    });
  });

  describe("No tickets validation", () => {
    test("should throw InvalidPurchaseException when no tickets are requested", async () => {
      await expect(ticketService.purchaseTickets(1)).rejects.toThrow(InvalidPurchaseException);
    });

    test("should throw InvalidPurchaseException when ticket request has 0 tickets", async () => {
      const zeroAdultTickets = new TicketTypeRequest("ADULT", 0);
      await expect(ticketService.purchaseTickets(1, zeroAdultTickets)).rejects.toThrow(InvalidPurchaseException);
    });

    test("should throw InvalidPurchaseException when ticket request has negative tickets", async () => {
      const negativeAdultTickets = new TicketTypeRequest("ADULT", -1);
      await expect(ticketService.purchaseTickets(1, negativeAdultTickets)).rejects.toThrow(InvalidPurchaseException);
    });

    test("should throw InvalidPurchaseException when all ticket requests have 0 tickets", async () => {
      const zeroAdultTickets = new TicketTypeRequest("ADULT", 0);
      const zeroChildTickets = new TicketTypeRequest("CHILD", 0);
      await expect(ticketService.purchaseTickets(1, zeroAdultTickets, zeroChildTickets)).rejects.toThrow(InvalidPurchaseException);
    });
  });

  describe("Payment calculation and processing", () => {
    test("should calculate correct payment for adult tickets only", () => {
      const adultTickets = new TicketTypeRequest("ADULT", 3);
      const expectedAmount = 3 * 25; // £25 per adult ticket

      void ticketService.purchaseTickets(1, adultTickets);

      expect(mockMakePayment).toHaveBeenCalledWith(1, expectedAmount);
    });

    test("should calculate correct payment for child tickets with adult tickets", () => {
      const adultTickets = new TicketTypeRequest("ADULT", 2);
      const childTickets = new TicketTypeRequest("CHILD", 3);
      const expectedAmount = 2 * 25 + 3 * 15; // £25 per adult + £15 per child

      void ticketService.purchaseTickets(1, adultTickets, childTickets);

      expect(mockMakePayment).toHaveBeenCalledWith(1, expectedAmount);
    });

    test("should calculate correct payment when infant tickets are free", () => {
      const adultTickets = new TicketTypeRequest("ADULT", 2);
      const infantTickets = new TicketTypeRequest("INFANT", 2);
      const expectedAmount = 2 * 25; // Only adult tickets charged, infants are free

      void ticketService.purchaseTickets(1, adultTickets, infantTickets);

      expect(mockMakePayment).toHaveBeenCalledWith(1, expectedAmount);
    });

    test("should calculate correct payment for mixed ticket types", () => {
      const adultTickets = new TicketTypeRequest("ADULT", 2);
      const childTickets = new TicketTypeRequest("CHILD", 3);
      const infantTickets = new TicketTypeRequest("INFANT", 1);
      const expectedAmount = 2 * 25 + 3 * 15 + 1 * 0; // £50 + £45 + £0

      void ticketService.purchaseTickets(1, adultTickets, childTickets, infantTickets);

      expect(mockMakePayment).toHaveBeenCalledWith(1, expectedAmount);
    });

    test("should handle multiple ticket requests of the same type", () => {
      const adultTickets1 = new TicketTypeRequest("ADULT", 2);
      const adultTickets2 = new TicketTypeRequest("ADULT", 1);
      const expectedAmount = 3 * 25; // Total 3 adult tickets

      void ticketService.purchaseTickets(1, adultTickets1, adultTickets2);

      expect(mockMakePayment).toHaveBeenCalledWith(1, expectedAmount);
    });

    test("should ensure payment amount is always an integer", () => {
      const adultTickets = new TicketTypeRequest("ADULT", 1);

      void ticketService.purchaseTickets(1, adultTickets);

      // Verify that the payment amount is an integer (as required by TicketPaymentService)
      expect(mockMakePayment).toHaveBeenCalledWith(1, expect.any(Number));
      const callArgs = mockMakePayment.mock.calls[0] as [number, number];
      expect(Number.isInteger(callArgs[1])).toBe(true);
    });
  });

  describe("Seat reservation", () => {
    test("should reserve correct number of seats for adults only", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 3);
      await ticketService.purchaseTickets(1, adultTickets);
      expect(mockReserveSeat).toHaveBeenCalledWith(1, 3);
    });

    test("should reserve seats for adults and children but not infants", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 2);
      const childTickets = new TicketTypeRequest("CHILD", 2);
      const infantTickets = new TicketTypeRequest("INFANT", 1);
      await ticketService.purchaseTickets(1, adultTickets, childTickets, infantTickets);
      expect(mockReserveSeat).toHaveBeenCalledWith(1, 4); // 2 adults + 2 children, no infants
    });

    test("should not reserve seats for infants only with adults", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 1);
      const infantTickets = new TicketTypeRequest("INFANT", 3);
      await ticketService.purchaseTickets(1, adultTickets, infantTickets);
      expect(mockReserveSeat).toHaveBeenCalledWith(1, 1); // Only 1 adult seat
    });

    test("should handle multiple ticket requests correctly for seat calculation", async () => {
      const adultTickets1 = new TicketTypeRequest("ADULT", 1);
      const adultTickets2 = new TicketTypeRequest("ADULT", 1);
      const childTickets = new TicketTypeRequest("CHILD", 2);
      await ticketService.purchaseTickets(1, adultTickets1, adultTickets2, childTickets);
      expect(mockReserveSeat).toHaveBeenCalledWith(1, 4); // 2 adults + 2 children
    });

    test("should ensure seat count is always an integer", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 2);
      const childTickets = new TicketTypeRequest("CHILD", 1);
      await ticketService.purchaseTickets(1, adultTickets, childTickets);
      // Verify that the seat count is an integer (as required by SeatReservationService)
      expect(mockReserveSeat).toHaveBeenCalledWith(1, expect.any(Number));
      const callArgs = mockReserveSeat.mock.calls[0] as [number, number];
      expect(Number.isInteger(callArgs[1])).toBe(true);
    });
  });

  describe("Service integration", () => {
    test("should call both payment and seat reservation services", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 2);
      const childTickets = new TicketTypeRequest("CHILD", 1);
      await ticketService.purchaseTickets(1, adultTickets, childTickets);
      expect(mockMakePayment).toHaveBeenCalledTimes(1);
      expect(mockReserveSeat).toHaveBeenCalledTimes(1);
    });

    test("should call services with correct account ID", async () => {
      const accountId = 12345;
      const adultTickets = new TicketTypeRequest("ADULT", 1);
      await ticketService.purchaseTickets(accountId, adultTickets);
      expect(mockMakePayment).toHaveBeenCalledWith(accountId, expect.any(Number));
      expect(mockReserveSeat).toHaveBeenCalledWith(accountId, expect.any(Number));
    });
  });

  describe("Error handling and resilience", () => {
    beforeEach(() => {
      // Reset mocks to their default behavior for error handling tests
      mockMakePayment.mockReset();
      mockReserveSeat.mockReset();
    });

    test("should handle payment service failures gracefully", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 1);
      mockMakePayment.mockImplementation(() => {
        throw new Error("Payment gateway unavailable");
      });
      await expect(ticketService.purchaseTickets(1, adultTickets)).rejects.toThrow(InvalidPurchaseException);
      await expect(ticketService.purchaseTickets(1, adultTickets)).rejects.toThrow("Payment processing failed: Payment gateway unavailable");
    });

    test("should handle seat reservation service failures gracefully", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 1);
      mockMakePayment.mockImplementation(() => {});
      mockReserveSeat.mockImplementation(() => {
        throw new Error("Seat booking system down");
      });
      await expect(ticketService.purchaseTickets(1, adultTickets)).rejects.toThrow(InvalidPurchaseException);
      await expect(ticketService.purchaseTickets(1, adultTickets)).rejects.toThrow("Seat reservation failed: Seat booking system down");
    });

    test("should handle unknown error types in payment service", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 1);
      mockMakePayment.mockImplementation(() => {
        const unknownError: unknown = "String error";
        throw unknownError;
      });
      await expect(ticketService.purchaseTickets(1, adultTickets)).rejects.toThrow("Payment processing failed: Unknown error");
    });

    test("should handle unknown error types in seat reservation service", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 1);
      mockMakePayment.mockImplementation(() => {});
      mockReserveSeat.mockImplementation(() => {
        const unknownError: unknown = { message: "object error" };
        throw unknownError;
      });
      await expect(ticketService.purchaseTickets(1, adultTickets)).rejects.toThrow("Seat reservation failed: Unknown error");
    });

    test("should not call seat reservation when no seats are needed", async () => {
      jest.clearAllMocks();
      const adultTickets = new TicketTypeRequest("ADULT", 0);
      const infantTickets = new TicketTypeRequest("INFANT", 1);
      await expect(ticketService.purchaseTickets(1, adultTickets, infantTickets)).rejects.toThrow(InvalidPurchaseException);
      expect(mockReserveSeat).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    test("should handle single ticket purchase", async () => {
      const adultTicket = new TicketTypeRequest("ADULT", 1);
      await expect(ticketService.purchaseTickets(1, adultTicket)).resolves.not.toThrow();
      expect(mockMakePayment).toHaveBeenCalledWith(1, 25);
      expect(mockReserveSeat).toHaveBeenCalledWith(1, 1);
    });

    test("should handle maximum valid purchase (25 tickets)", async () => {
      const adultTickets = new TicketTypeRequest("ADULT", 20);
      const childTickets = new TicketTypeRequest("CHILD", 5);
      await expect(ticketService.purchaseTickets(1, adultTickets, childTickets)).resolves.not.toThrow();
      expect(mockMakePayment).toHaveBeenCalledWith(1, 20 * 25 + 5 * 15);
      expect(mockReserveSeat).toHaveBeenCalledWith(1, 25);
    });

    test("should handle large account ID", async () => {
      const largeAccountId = 999999999;
      const adultTicket = new TicketTypeRequest("ADULT", 1);
      await expect(ticketService.purchaseTickets(largeAccountId, adultTicket)).resolves.not.toThrow();
      expect(mockMakePayment).toHaveBeenCalledWith(largeAccountId, 25);
      expect(mockReserveSeat).toHaveBeenCalledWith(largeAccountId, 1);
    });
  });

  describe("Complex scenarios", () => {
    test("should handle family purchase scenario", async () => {
      // Family of 2 adults, 2 children, 1 infant
      const adultTickets = new TicketTypeRequest("ADULT", 2);
      const childTickets = new TicketTypeRequest("CHILD", 2);
      const infantTickets = new TicketTypeRequest("INFANT", 1);
      await ticketService.purchaseTickets(1, adultTickets, childTickets, infantTickets);
      // Payment: 2 adults (£50) + 2 children (£30) + 1 infant (£0) = £80
      expect(mockMakePayment).toHaveBeenCalledWith(1, 80);
      // Seats: 2 adults + 2 children = 4 seats (infant sits on adult's lap)
      expect(mockReserveSeat).toHaveBeenCalledWith(1, 4);
    });

    test("should handle nursery group scenario", async () => {
      // 3 adults supervising 8 infants
      const adultTickets = new TicketTypeRequest("ADULT", 3);
      const infantTickets = new TicketTypeRequest("INFANT", 8);
      await ticketService.purchaseTickets(1, adultTickets, infantTickets);
      // Payment: 3 adults (£75) + 8 infants (£0) = £75
      expect(mockMakePayment).toHaveBeenCalledWith(1, 75);
      // Seats: 3 adults only = 3 seats
      expect(mockReserveSeat).toHaveBeenCalledWith(1, 3);
    });

    test("should handle school trip scenario", async () => {
      // 2 adults with 10 children
      const adultTickets = new TicketTypeRequest("ADULT", 2);
      const childTickets = new TicketTypeRequest("CHILD", 10);
      await ticketService.purchaseTickets(1, adultTickets, childTickets);
      // Payment: 2 adults (£50) + 10 children (£150) = £200
      expect(mockMakePayment).toHaveBeenCalledWith(1, 200);
      // Seats: 2 adults + 10 children = 12 seats
      expect(mockReserveSeat).toHaveBeenCalledWith(1, 12);
    });
  });
});
