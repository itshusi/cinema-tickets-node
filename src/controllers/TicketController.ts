import type { Request, Response } from "express";
import TicketService from "../pairtest/TicketService.js";
import { type PurchaseResult } from "../pairtest/interfaces/TicketServiceApi.js";
import TicketTypeRequest from "../pairtest/lib/TicketTypeRequest.js";
import InvalidPurchaseException from "../pairtest/lib/InvalidPurchaseException.js";
import { PaymentServiceAdapter, SeatReservationServiceAdapter } from "../adapters/ServiceAdapters.js";
import { TICKET_PRICES, TicketType, TicketCounts } from "../types/TicketTypes.js";
import type { TicketItem, TicketPurchaseRequestBody, TicketSummary, SuccessResponse, ErrorResponse, ErrorDetails } from "../types/ApiTypes.js";

export class TicketController {
  private readonly ticketService: TicketService;

  constructor() {
    const paymentService = new PaymentServiceAdapter();
    const seatReservationService = new SeatReservationServiceAdapter();
    this.ticketService = new TicketService(paymentService, seatReservationService);
  }

  public purchaseTickets = async (
    req: Request<object, SuccessResponse | ErrorResponse, TicketPurchaseRequestBody>,
    res: Response<SuccessResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      this.ensureValidRequestFormat(req.body);

      const { accountId, tickets } = req.body;
      const ticketRequests = this.createTicketRequestsFromApiInput(tickets);
      const purchaseResult = await this.ticketService.purchaseTickets(accountId, ...ticketRequests);
      const response = this.buildSuccessResponse(purchaseResult, tickets);

      res.status(200).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private ensureValidRequestFormat(body: unknown): asserts body is TicketPurchaseRequestBody {
    if (!body || typeof body !== "object") {
      throw new InvalidPurchaseException("Request body is required");
    }

    const typedBody = body as Record<string, unknown>;

    if (typeof typedBody["accountId"] !== "number") {
      throw new InvalidPurchaseException("accountId must be a number");
    }

    if (!Array.isArray(typedBody["tickets"])) {
      throw new InvalidPurchaseException("tickets must be an array");
    }

    if (typedBody["tickets"].length === 0) {
      throw new InvalidPurchaseException("At least one ticket must be requested");
    }

    // Basic structure validation only - let TicketService handle business rules
    typedBody["tickets"].forEach((ticket: unknown, index: number) => {
      if (!ticket || typeof ticket !== "object") {
        throw new InvalidPurchaseException(`Invalid ticket at index ${index}`);
      }

      const typedTicket = ticket as Record<string, unknown>;

      if (typeof typedTicket["type"] !== "string") {
        throw new InvalidPurchaseException(`Ticket type must be a string at index ${index}`);
      }

      if (typeof typedTicket["quantity"] !== "number") {
        throw new InvalidPurchaseException(`Ticket quantity must be a number at index ${index}`);
      }
    });
  }

  private createTicketRequestsFromApiInput(tickets: TicketItem[]): TicketTypeRequest[] {
    return tickets.map(ticket => new TicketTypeRequest(ticket.type, ticket.quantity));
  }

  private buildSuccessResponse(purchaseResult: PurchaseResult, originalTickets: TicketItem[]): SuccessResponse {
    const ticketSummary = this.convertDomainTicketCountsToApiSummary(purchaseResult.ticketCounts, originalTickets);

    return {
      success: true,
      data: {
        accountId: purchaseResult.accountId,
        totalAmount: purchaseResult.totalAmount,
        totalSeats: purchaseResult.totalSeats,
        tickets: ticketSummary,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private convertDomainTicketCountsToApiSummary(ticketCounts: TicketCounts, originalTickets: TicketItem[]): TicketSummary[] {
    // Convert domain counts to API summary format, maintaining original order
    const orderedTypes: TicketType[] = [];
    const typesSeen = new Set<TicketType>();

    // Preserve the order from original request
    originalTickets.forEach(ticket => {
      const ticketType = ticket.type as TicketType;
      if (!typesSeen.has(ticketType)) {
        orderedTypes.push(ticketType);
        typesSeen.add(ticketType);
      }
    });

    return orderedTypes.map(type => ({
      type,
      quantity: ticketCounts[type],
      price: ticketCounts[type] * TICKET_PRICES[type],
    }));
  }

  private handleError(error: unknown, res: Response<ErrorResponse>): void {
    const timestamp = new Date().toISOString();

    if (error instanceof InvalidPurchaseException) {
      this.handleBusinessRuleViolation(error, res, timestamp);
    } else if (error instanceof TypeError) {
      this.handleTypeValidationError(error, res, timestamp);
    } else {
      this.handleUnexpectedError(error, res, timestamp);
    }
  }

  private handleBusinessRuleViolation(error: InvalidPurchaseException, res: Response<ErrorResponse>, timestamp: string): void {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        type: this.categoriseErrorType(error.message),
        code: this.mapErrorMessageToCode(error.message),
        message: error.message,
        timestamp,
        details: this.extractRelevantErrorDetails(error.message),
      },
    };

    const statusCode = this.determineHttpStatusCode(error.message);
    res.status(statusCode).json(errorResponse);
  }

  private handleTypeValidationError(error: TypeError, res: Response<ErrorResponse>, timestamp: string): void {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        type: "VALIDATION_ERROR",
        code: "INVALID_INPUT_TYPE",
        message: error.message,
        timestamp,
      },
    };

    res.status(400).json(errorResponse);
  }

  private handleUnexpectedError(error: unknown, res: Response<ErrorResponse>, timestamp: string): void {
    console.error("Unexpected error:", error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        type: "INTERNAL_ERROR",
        code: "UNEXPECTED_ERROR",
        message: "An unexpected error occurred while processing your request",
        timestamp,
      },
    };

    res.status(500).json(errorResponse);
  }

  private categoriseErrorType(message: string): string {
    if (message.includes("Invalid account ID") || message.includes("must be")) {
      return "VALIDATION_ERROR";
    }

    if (message.includes("Child and Infant tickets require") || message.includes("Cannot purchase more than")) {
      return "BUSINESS_RULE_VIOLATION";
    }

    if (message.includes("Payment processing failed")) {
      return "PAYMENT_FAILURE";
    }

    if (message.includes("Seat reservation failed")) {
      return "SEAT_RESERVATION_FAILURE";
    }

    return "VALIDATION_ERROR";
  }

  private mapErrorMessageToCode(message: string): string {
    if (message.includes("Invalid account ID")) {
      return "INVALID_ACCOUNT_ID";
    }

    if (message.includes("Child and Infant tickets require")) {
      return "ADULT_SUPERVISION_REQUIRED";
    }

    if (message.includes("Cannot purchase more than")) {
      return "TICKET_LIMIT_EXCEEDED";
    }

    if (message.includes("Payment processing failed")) {
      return "PAYMENT_DECLINED";
    }

    if (message.includes("Seat reservation failed")) {
      return "SEAT_RESERVATION_FAILED";
    }

    if (message.includes("At least one ticket")) {
      return "NO_TICKETS_REQUESTED";
    }

    return "VALIDATION_ERROR";
  }

  private determineHttpStatusCode(message: string): number {
    // 400 Bad Request - Client error in request format/structure
    if (
      message.includes("Request body is required") ||
      message.includes("must be a number") ||
      message.includes("must be an array") ||
      message.includes("must be a string") ||
      message.includes("At least one ticket")
    ) {
      return 400;
    }

    // 400 Bad Request - Invalid account ID (client provided invalid data)
    if (message.includes("Invalid account ID")) {
      return 400;
    }

    // 422 Unprocessable Entity - Valid request format but business rule violations
    if (message.includes("Child and Infant tickets require") || message.includes("Cannot purchase more than")) {
      return 422;
    }

    // 402 Payment Required - Payment processing failed
    if (message.includes("Payment processing failed")) {
      return 402;
    }

    // 503 Service Unavailable - External service failures (seat reservation)
    if (message.includes("Seat reservation failed")) {
      return 503;
    }

    // Default to 400 for any other validation errors
    return 400;
  }

  private extractRelevantErrorDetails(message: string): ErrorDetails | undefined {
    const details: ErrorDetails = {};

    // Extract account ID from error message
    const accountIdMatch = message.match(/Invalid account ID: (-?\d+)/);
    if (accountIdMatch?.[1]) {
      details["providedAccountId"] = parseInt(accountIdMatch[1], 10);
    }

    // Extract ticket counts from supervision error
    const supervisionMatch = message.match(/(\d+) Child ticket\(s\)(?: and (\d+) Infant ticket\(s\))?/);
    if (supervisionMatch?.[1]) {
      details["childTickets"] = parseInt(supervisionMatch[1], 10);
      if (supervisionMatch[2]) {
        details["infantTickets"] = parseInt(supervisionMatch[2], 10);
      }
      details["adultTickets"] = 0;
    }

    // Extract ticket limit details
    const limitMatch = message.match(/Requested: (\d+) tickets/);
    if (limitMatch?.[1]) {
      details["requestedTickets"] = parseInt(limitMatch[1], 10);
      details["maxAllowed"] = 25;
    }

    return Object.keys(details).length > 0 ? details : undefined;
  }
}
