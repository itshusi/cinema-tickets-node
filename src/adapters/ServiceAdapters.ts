import type { PaymentProcessingService, SeatAllocationService } from "../pairtest/interfaces/TicketServiceApi";
import type { PaymentServiceInstance, PaymentServiceModule, SeatReservationServiceInstance, SeatReservationServiceModule } from "../types/ThirdParty";

export class PaymentServiceAdapter implements PaymentProcessingService {
  private service: PaymentServiceInstance | null = null;
  private initialized = false;

  async makePayment(accountId: number, totalAmountToPay: number): Promise<void> {
    try {
      if (!this.initialized) {
        const module = (await import("../thirdparty/paymentgateway/TicketPaymentService.js")) as PaymentServiceModule;
        const TicketPaymentServiceImpl = module.default;

        if (!TicketPaymentServiceImpl) {
          throw new Error("Payment service implementation not found");
        }

        this.service = new TicketPaymentServiceImpl();
        this.initialized = true;
      }

      if (!this.service) {
        throw new Error("Payment service not properly initialized");
      }

      this.service.makePayment(accountId, totalAmountToPay);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown payment service error";
      throw new Error(`Payment processing failed: ${errorMessage}`);
    }
  }
}

export class SeatReservationServiceAdapter implements SeatAllocationService {
  private service: SeatReservationServiceInstance | null = null;
  private initialized = false;

  async reserveSeat(accountId: number, totalSeatsToAllocate: number): Promise<void> {
    try {
      if (!this.initialized) {
        const module = (await import("../thirdparty/seatbooking/SeatReservationService.js")) as SeatReservationServiceModule;
        const SeatReservationServiceImpl = module.default;

        if (!SeatReservationServiceImpl) {
          throw new Error("Seat reservation service implementation not found");
        }

        this.service = new SeatReservationServiceImpl();
        this.initialized = true;
      }

      if (!this.service) {
        throw new Error("Seat reservation service not properly initialized");
      }

      if (totalSeatsToAllocate <= 0) {
        throw new Error("Invalid seat count: must reserve at least one seat");
      }

      this.service.reserveSeat(accountId, totalSeatsToAllocate);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown seat reservation error";
      throw new Error(`Seat reservation failed: ${errorMessage}`);
    }
  }
}
