declare module '../thirdparty/paymentgateway/TicketPaymentService' {
  export default class TicketPaymentService {
    makePayment(accountId: number, totalAmountToPay: number): void;
  }
}

declare module '../thirdparty/seatbooking/SeatReservationService' {
  export default class SeatReservationService {
    reserveSeat(accountId: number, totalSeatsToAllocate: number): void;
  }
}
