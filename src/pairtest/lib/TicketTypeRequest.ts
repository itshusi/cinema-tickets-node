/**
 * Immutable Object.
 */

export default class TicketTypeRequest {
  readonly #type;

  readonly #noOfTickets;

  constructor(type: string, noOfTickets: number) {
    if (!this.#Type.includes(type)) {
      throw new TypeError(
        `type must be ${this.#Type.slice(0, -1).join(', ')}, or ${this.#Type.slice(-1)[0]}`
      );
    }

    if (!Number.isInteger(noOfTickets)) {
      throw new TypeError('noOfTickets must be an integer');
    }

    this.#type = type;
    this.#noOfTickets = noOfTickets;
  }

  getNoOfTickets(): number {
    return this.#noOfTickets;
  }

  getTicketType(): string {
    return this.#type;
  }

  readonly #Type = ['ADULT', 'CHILD', 'INFANT'];
}
