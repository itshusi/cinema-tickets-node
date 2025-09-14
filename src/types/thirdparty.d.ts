// Type definitions for third-party JavaScript services
// These services cannot be modified per requirements

declare module 'TicketPaymentService' {
  export default class TicketPaymentService {
    makePayment(accountId: number, totalAmountToPay: number): void;
  }
}

declare module 'SeatReservationService' {
  export default class SeatReservationService {
    reserveSeat(accountId: number, totalSeatsToAllocate: number): void;
  }
}
