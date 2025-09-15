export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  testMatch: ["**/test/**/*.test.ts"],
  collectCoverageFrom: ["src/**/InvalidPurchaseException.ts", "src/**/TicketService.ts", "src/**/TicketTypeRequest.ts", "!src/**/*.d.ts"],
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^TicketPaymentService$": "<rootDir>/src/thirdparty/paymentgateway/TicketPaymentService",
    "^SeatReservationService$": "<rootDir>/src/thirdparty/seatbooking/SeatReservationService",
  },
};
