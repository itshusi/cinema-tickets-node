/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, Response } from "express";
import { TicketController } from "../../src/controllers/TicketController.js";
import { type PurchaseResult } from "../../src/pairtest/interfaces/TicketServiceApi.js";
import InvalidPurchaseException from "../../src/pairtest/lib/InvalidPurchaseException.js";
import type { TicketPurchaseRequestBody, SuccessResponse, ErrorResponse } from "../../src/types/ApiTypes.js";

// Mock the TicketService
jest.mock("../../src/pairtest/TicketService.js", () => {
  return jest.fn().mockImplementation(() => ({
    purchaseTickets: jest.fn(),
  }));
});

// Mock the adapters
jest.mock("../../src/adapters/ServiceAdapters.js", () => ({
  PaymentServiceAdapter: jest.fn(),
  SeatReservationServiceAdapter: jest.fn(),
}));

describe("TicketController", () => {
  let controller: TicketController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {};
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    controller = new TicketController();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("purchaseTickets", () => {
    describe("successful purchases", () => {
      it("should handle valid ticket purchase request", async () => {
        const validRequestBody: TicketPurchaseRequestBody = {
          accountId: 1,
          tickets: [
            { type: "ADULT", quantity: 2 },
            { type: "CHILD", quantity: 1 },
          ],
        };

        const mockPurchaseResult: PurchaseResult = {
          accountId: 1,
          totalAmount: 65,
          totalSeats: 3,
          ticketCounts: { ADULT: 2, CHILD: 1, INFANT: 0 },
        };

        // Mock the ticket service to return success
        const mockTicketService = (controller as any).ticketService;
        mockTicketService.purchaseTickets.mockResolvedValue(mockPurchaseResult);

        mockRequest.body = validRequestBody;

        await controller.purchaseTickets(
          mockRequest as Request<object, SuccessResponse | ErrorResponse, TicketPurchaseRequestBody>,
          mockResponse as Response<SuccessResponse | ErrorResponse>
        );

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              accountId: 1,
              totalAmount: 65,
              totalSeats: 3,
              tickets: expect.arrayContaining([
                { type: "ADULT", quantity: 2, price: 50 },
                { type: "CHILD", quantity: 1, price: 15 },
              ]),
            }),
          })
        );
      });

      it("should handle family purchase with infant", async () => {
        const requestWithInfant: TicketPurchaseRequestBody = {
          accountId: 123,
          tickets: [
            { type: "ADULT", quantity: 2 },
            { type: "CHILD", quantity: 1 },
            { type: "INFANT", quantity: 1 },
          ],
        };

        const mockPurchaseResult: PurchaseResult = {
          accountId: 123,
          totalAmount: 65,
          totalSeats: 3,
          ticketCounts: { ADULT: 2, CHILD: 1, INFANT: 1 },
        };

        const mockTicketService = (controller as any).ticketService;
        mockTicketService.purchaseTickets.mockResolvedValue(mockPurchaseResult);

        mockRequest.body = requestWithInfant;

        await controller.purchaseTickets(
          mockRequest as Request<object, SuccessResponse | ErrorResponse, TicketPurchaseRequestBody>,
          mockResponse as Response<SuccessResponse | ErrorResponse>
        );

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              accountId: 123,
              totalAmount: 65,
              totalSeats: 3, // Infant doesn't count
              tickets: expect.arrayContaining([
                { type: "ADULT", quantity: 2, price: 50 },
                { type: "CHILD", quantity: 1, price: 15 },
                { type: "INFANT", quantity: 1, price: 0 },
              ]),
            }),
          })
        );
      });
    });

    describe("request validation errors", () => {
      it("should reject missing request body", async () => {
        mockRequest.body = undefined;

        await controller.purchaseTickets(
          mockRequest as Request<object, SuccessResponse | ErrorResponse, TicketPurchaseRequestBody>,
          mockResponse as Response<SuccessResponse | ErrorResponse>
        );

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              type: "VALIDATION_ERROR",
              message: "Request body is required",
            }),
          })
        );
      });

      it("should reject invalid account ID type", async () => {
        mockRequest.body = {
          accountId: "invalid",
          tickets: [{ type: "ADULT", quantity: 1 }],
        };

        await controller.purchaseTickets(
          mockRequest as Request<object, SuccessResponse | ErrorResponse, TicketPurchaseRequestBody>,
          mockResponse as Response<SuccessResponse | ErrorResponse>
        );

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              type: "VALIDATION_ERROR",
              message: "accountId must be a number",
            }),
          })
        );
      });

      it("should reject missing tickets array", async () => {
        mockRequest.body = {
          accountId: 1,
          tickets: undefined,
        };

        await controller.purchaseTickets(
          mockRequest as Request<object, SuccessResponse | ErrorResponse, TicketPurchaseRequestBody>,
          mockResponse as Response<SuccessResponse | ErrorResponse>
        );

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              message: "tickets must be an array",
            }),
          })
        );
      });

      it("should reject empty tickets array", async () => {
        mockRequest.body = {
          accountId: 1,
          tickets: [],
        };

        await controller.purchaseTickets(
          mockRequest as Request<object, SuccessResponse | ErrorResponse, TicketPurchaseRequestBody>,
          mockResponse as Response<SuccessResponse | ErrorResponse>
        );

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              message: "At least one ticket must be requested",
            }),
          })
        );
      });

      it("should reject invalid ticket structure", async () => {
        mockRequest.body = {
          accountId: 1,
          tickets: [{ type: "ADULT" }], // Missing quantity
        };

        await controller.purchaseTickets(
          mockRequest as Request<object, SuccessResponse | ErrorResponse, TicketPurchaseRequestBody>,
          mockResponse as Response<SuccessResponse | ErrorResponse>
        );

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              message: "Ticket quantity must be a number at index 0",
            }),
          })
        );
      });
    });

    describe("business rule violations", () => {
      it("should handle invalid account ID business rule", async () => {
        const invalidRequest: TicketPurchaseRequestBody = {
          accountId: 0,
          tickets: [{ type: "ADULT", quantity: 1 }],
        };

        const mockTicketService = (controller as any).ticketService;
        mockTicketService.purchaseTickets.mockRejectedValue(
          new InvalidPurchaseException("Invalid account ID: 0. Account ID must be a positive integer greater than 0")
        );

        mockRequest.body = invalidRequest;

        await controller.purchaseTickets(
          mockRequest as Request<object, SuccessResponse | ErrorResponse, TicketPurchaseRequestBody>,
          mockResponse as Response<SuccessResponse | ErrorResponse>
        );

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              type: "VALIDATION_ERROR",
              code: "INVALID_ACCOUNT_ID",
              message: "Invalid account ID: 0. Account ID must be a positive integer greater than 0",
              details: { providedAccountId: 0 },
            }),
          })
        );
      });

      it("should handle adult supervision requirement", async () => {
        const childOnlyRequest: TicketPurchaseRequestBody = {
          accountId: 1,
          tickets: [{ type: "CHILD", quantity: 2 }],
        };

        const mockTicketService = (controller as any).ticketService;
        mockTicketService.purchaseTickets.mockRejectedValue(
          new InvalidPurchaseException(
            "Child and Infant tickets require at least one Adult ticket. Attempted to purchase: 2 Child ticket(s) without any Adult tickets"
          )
        );

        mockRequest.body = childOnlyRequest;

        await controller.purchaseTickets(
          mockRequest as Request<object, SuccessResponse | ErrorResponse, TicketPurchaseRequestBody>,
          mockResponse as Response<SuccessResponse | ErrorResponse>
        );

        expect(mockStatus).toHaveBeenCalledWith(422);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              type: "BUSINESS_RULE_VIOLATION",
              code: "ADULT_SUPERVISION_REQUIRED",
              details: expect.objectContaining({
                childTickets: 2,
                adultTickets: 0,
              }),
            }),
          })
        );
      });

      it("should handle ticket limit exceeded", async () => {
        const tooManyTicketsRequest: TicketPurchaseRequestBody = {
          accountId: 1,
          tickets: [{ type: "ADULT", quantity: 26 }],
        };

        const mockTicketService = (controller as any).ticketService;
        mockTicketService.purchaseTickets.mockRejectedValue(
          new InvalidPurchaseException("Cannot purchase more than 25 tickets at a time. Requested: 26 tickets")
        );

        mockRequest.body = tooManyTicketsRequest;

        await controller.purchaseTickets(
          mockRequest as Request<object, SuccessResponse | ErrorResponse, TicketPurchaseRequestBody>,
          mockResponse as Response<SuccessResponse | ErrorResponse>
        );

        expect(mockStatus).toHaveBeenCalledWith(422);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              type: "BUSINESS_RULE_VIOLATION",
              code: "TICKET_LIMIT_EXCEEDED",
              details: expect.objectContaining({
                requestedTickets: 26,
                maxAllowed: 25,
              }),
            }),
          })
        );
      });
    });

    describe("external service failures", () => {
      it("should handle payment processing failure", async () => {
        const validRequest: TicketPurchaseRequestBody = {
          accountId: 1,
          tickets: [{ type: "ADULT", quantity: 1 }],
        };

        const mockTicketService = (controller as any).ticketService;
        mockTicketService.purchaseTickets.mockRejectedValue(new InvalidPurchaseException("Payment processing failed: Payment gateway unavailable"));

        mockRequest.body = validRequest;

        await controller.purchaseTickets(
          mockRequest as Request<object, SuccessResponse | ErrorResponse, TicketPurchaseRequestBody>,
          mockResponse as Response<SuccessResponse | ErrorResponse>
        );

        expect(mockStatus).toHaveBeenCalledWith(402);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              type: "PAYMENT_FAILURE",
              code: "PAYMENT_DECLINED",
            }),
          })
        );
      });

      it("should handle seat reservation failure", async () => {
        const validRequest: TicketPurchaseRequestBody = {
          accountId: 1,
          tickets: [{ type: "ADULT", quantity: 1 }],
        };

        const mockTicketService = (controller as any).ticketService;
        mockTicketService.purchaseTickets.mockRejectedValue(new InvalidPurchaseException("Seat reservation failed: No seats available"));

        mockRequest.body = validRequest;

        await controller.purchaseTickets(
          mockRequest as Request<object, SuccessResponse | ErrorResponse, TicketPurchaseRequestBody>,
          mockResponse as Response<SuccessResponse | ErrorResponse>
        );

        expect(mockStatus).toHaveBeenCalledWith(503);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              type: "SEAT_RESERVATION_FAILURE",
              code: "SEAT_RESERVATION_FAILED",
            }),
          })
        );
      });
    });

    describe("unexpected errors", () => {
      it("should handle TypeError from TicketTypeRequest", async () => {
        const validRequest: TicketPurchaseRequestBody = {
          accountId: 1,
          tickets: [{ type: "ADULT", quantity: 1 }],
        };

        const mockTicketService = (controller as any).ticketService;
        mockTicketService.purchaseTickets.mockRejectedValue(new TypeError("Invalid ticket type"));

        mockRequest.body = validRequest;

        await controller.purchaseTickets(
          mockRequest as Request<object, SuccessResponse | ErrorResponse, TicketPurchaseRequestBody>,
          mockResponse as Response<SuccessResponse | ErrorResponse>
        );

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              type: "VALIDATION_ERROR",
              code: "INVALID_INPUT_TYPE",
              message: "Invalid ticket type",
            }),
          })
        );
      });

      it("should handle unexpected errors", async () => {
        const validRequest: TicketPurchaseRequestBody = {
          accountId: 1,
          tickets: [{ type: "ADULT", quantity: 1 }],
        };

        const mockTicketService = (controller as any).ticketService;
        mockTicketService.purchaseTickets.mockRejectedValue(new Error("Database connection failed"));

        mockRequest.body = validRequest;

        await controller.purchaseTickets(
          mockRequest as Request<object, SuccessResponse | ErrorResponse, TicketPurchaseRequestBody>,
          mockResponse as Response<SuccessResponse | ErrorResponse>
        );

        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              type: "INTERNAL_ERROR",
              code: "UNEXPECTED_ERROR",
              message: "An unexpected error occurred while processing your request",
            }),
          })
        );
      });
    });
  });

  describe("helper methods", () => {
    describe("convertDomainTicketCountsToApiSummary", () => {
      it("should preserve original ticket order", () => {
        const ticketCounts = { ADULT: 2, CHILD: 1, INFANT: 1 };
        const originalTickets = [
          { type: "CHILD", quantity: 1 },
          { type: "ADULT", quantity: 2 },
          { type: "INFANT", quantity: 1 },
        ];

        const result = (controller as any).convertDomainTicketCountsToApiSummary(ticketCounts, originalTickets);

        expect(result).toEqual([
          { type: "CHILD", quantity: 1, price: 15 },
          { type: "ADULT", quantity: 2, price: 50 },
          { type: "INFANT", quantity: 1, price: 0 },
        ]);
      });
    });
  });
});
