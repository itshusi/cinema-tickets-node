declare module "*/thirdparty/paymentgateway/TicketPaymentService.js" {
  export default class TicketPaymentService {
    makePayment(accountId: number, totalAmountToPay: number): void;
  }
}

declare module "*/thirdparty/seatbooking/SeatReservationService.js" {
  export default class SeatReservationService {
    reserveSeat(accountId: number, totalSeatsToAllocate: number): void;
  }
}
