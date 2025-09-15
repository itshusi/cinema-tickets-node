// Shared types for third-party JS service instances
export interface PaymentServiceInstance {
  makePayment(accountId: number, totalAmountToPay: number): void;
}

export interface SeatReservationServiceInstance {
  reserveSeat(accountId: number, totalSeatsToAllocate: number): void;
}

export type PaymentServiceModule = {
  default: new () => PaymentServiceInstance;
};

export type SeatReservationServiceModule = {
  default: new () => SeatReservationServiceInstance;
};
