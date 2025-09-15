import TicketTypeRequest from "../../src/pairtest/lib/TicketTypeRequest";

describe("TicketTypeRequest", () => {
  describe("constructor validation", () => {
    test("should create valid ADULT ticket request", () => {
      const request = new TicketTypeRequest("ADULT", 5);

      expect(request.getTicketType()).toBe("ADULT");
      expect(request.getNoOfTickets()).toBe(5);
    });

    test("should create valid CHILD ticket request", () => {
      const request = new TicketTypeRequest("CHILD", 3);

      expect(request.getTicketType()).toBe("CHILD");
      expect(request.getNoOfTickets()).toBe(3);
    });

    test("should create valid INFANT ticket request", () => {
      const request = new TicketTypeRequest("INFANT", 2);

      expect(request.getTicketType()).toBe("INFANT");
      expect(request.getNoOfTickets()).toBe(2);
    });

    test("should throw TypeError for invalid ticket type", () => {
      expect(() => {
        new TicketTypeRequest("INVALID", 1);
      }).toThrow(TypeError);

      expect(() => {
        new TicketTypeRequest("adult", 1); // lowercase
      }).toThrow(TypeError);

      expect(() => {
        new TicketTypeRequest("SENIOR", 1); // not supported
      }).toThrow(TypeError);
    });

    test("should throw TypeError for non-integer number of tickets", () => {
      expect(() => {
        new TicketTypeRequest("ADULT", 1.5);
      }).toThrow(TypeError);

      expect(() => {
        new TicketTypeRequest("ADULT", "5");
      }).toThrow(TypeError);

      expect(() => {
        new TicketTypeRequest("ADULT", null);
      }).toThrow(TypeError);

      expect(() => {
        new TicketTypeRequest("ADULT", undefined);
      }).toThrow(TypeError);
    });

    test("should allow zero tickets (validation should be in TicketService)", () => {
      const request = new TicketTypeRequest("ADULT", 0);

      expect(request.getTicketType()).toBe("ADULT");
      expect(request.getNoOfTickets()).toBe(0);
    });

    test("should allow negative numbers (validation should be in TicketService)", () => {
      const request = new TicketTypeRequest("ADULT", -1);

      expect(request.getTicketType()).toBe("ADULT");
      expect(request.getNoOfTickets()).toBe(-1);
    });
  });

  describe("immutability", () => {
    test("should not expose private properties directly", () => {
      const request = new TicketTypeRequest("ADULT", 5);

      // Private fields should not be accessible
      expect((request as Record<string, unknown>).type).toBeUndefined();
      expect((request as Record<string, unknown>).noOfTickets).toBeUndefined();
    });

    test("should maintain consistent values after multiple calls", () => {
      const request = new TicketTypeRequest("CHILD", 3);

      // Multiple calls should return the same values
      expect(request.getTicketType()).toBe("CHILD");
      expect(request.getTicketType()).toBe("CHILD");
      expect(request.getNoOfTickets()).toBe(3);
      expect(request.getNoOfTickets()).toBe(3);
    });

    test("should be a truly immutable object", () => {
      const request = new TicketTypeRequest("ADULT", 5);
      const originalType = request.getTicketType();
      const originalTickets = request.getNoOfTickets();

      // Try to add properties (should not affect the object)
      (request as Record<string, unknown>).newProperty = "test";

      // Original values should remain unchanged
      expect(request.getTicketType()).toBe(originalType);
      expect(request.getNoOfTickets()).toBe(originalTickets);
    });
  });

  describe("getter methods", () => {
    test("getTicketType should return the correct type", () => {
      const adultRequest = new TicketTypeRequest("ADULT", 1);
      const childRequest = new TicketTypeRequest("CHILD", 1);
      const infantRequest = new TicketTypeRequest("INFANT", 1);

      expect(adultRequest.getTicketType()).toBe("ADULT");
      expect(childRequest.getTicketType()).toBe("CHILD");
      expect(infantRequest.getTicketType()).toBe("INFANT");
    });

    test("getNoOfTickets should return the correct number", () => {
      const request1 = new TicketTypeRequest("ADULT", 1);
      const request5 = new TicketTypeRequest("ADULT", 5);
      const request10 = new TicketTypeRequest("ADULT", 10);

      expect(request1.getNoOfTickets()).toBe(1);
      expect(request5.getNoOfTickets()).toBe(5);
      expect(request10.getNoOfTickets()).toBe(10);
    });
  });

  describe("edge cases", () => {
    test("should handle maximum safe integer", () => {
      const maxSafeInt = Number.MAX_SAFE_INTEGER;
      const request = new TicketTypeRequest("ADULT", maxSafeInt);

      expect(request.getNoOfTickets()).toBe(maxSafeInt);
    });

    test("should handle minimum safe integer", () => {
      const minSafeInt = Number.MIN_SAFE_INTEGER;
      const request = new TicketTypeRequest("ADULT", minSafeInt);

      expect(request.getNoOfTickets()).toBe(minSafeInt);
    });
  });
});
