# Cinema Tickets Booking

A TypeScript implementation of the DWP cinema ticket booking service exercise.

### Exercise Constraints Maintained

- ✅ **Core TicketService logic** - Original business rules and validation intact
- ✅ **Third-party packages** - NOT modified (thirdparty.\* untouched)
- ✅ **TicketTypeRequest** - Immutable object implementation maintained
- ✅ **External services** - Used as-is with proper integration

**Note**: This implementation extends beyond the basic exercise requirements by adding a comprehensive REST API layer, enhanced interfaces for better type safety, and production-ready features while maintaining all core business logic.

## Business Rules (Exercise Requirements)

### Ticket Types & Pricing

| Ticket Type | Price | Seat Required            |
| ----------- | ----- | ------------------------ |
| **INFANT**  | £0    | No (sits on adult's lap) |
| **CHILD**   | £15   | Yes                      |
| **ADULT**   | £25   | Yes                      |

### Purchase Constraints

- **Maximum 25 tickets** per transaction
- **Child and Infant tickets** cannot be purchased without at least one Adult ticket
- **Account ID** must be greater than zero (as per exercise assumptions)
- **Infants** do not pay and do not require seats (sit on adult's lap)

## Overview

This application provides a robust ticket booking service that:

- **REST API** with OpenAPI/Swagger documentation
- **Business rule validation** for ticket purchases
- **Payment processing** through external payment gateway integration
- **Seat reservation** via external seat booking service
- **Comprehensive error handling** with detailed API responses
- **Production-ready Docker** setup with health checks
- **Type-safe TypeScript** implementation with comprehensive test coverage

## API Endpoints

### Core API

- **POST** `/tickets/purchase` - Purchase cinema tickets
- **GET** `/health` - Health check endpoint
- **GET** `/` - API information and available endpoints
- **GET** `/api-docs` - Interactive Swagger/OpenAPI documentation

### Example API Usage

```bash
# Health check
curl http://localhost:3000/health

# Purchase tickets (IPv6 recommended for local development)
curl -6 -X POST http://localhost:3000/tickets/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": 1,
    "tickets": [
      {"type": "ADULT", "quantity": 2},
      {"type": "CHILD", "quantity": 1}
    ]
  }'
```

### API Response Examples

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "accountId": 1,
    "totalAmount": 65,
    "totalSeats": 3,
    "tickets": [
      { "type": "ADULT", "quantity": 2, "price": 50 },
      { "type": "CHILD", "quantity": 1, "price": 15 }
    ],
    "timestamp": "2025-09-15T21:39:55.982Z"
  }
}
```

**Error Response (422 Unprocessable Entity):**

```json
{
  "success": false,
  "error": {
    "type": "BUSINESS_RULE_VIOLATION",
    "code": "ADULT_SUPERVISION_REQUIRED",
    "message": "Child and Infant tickets require at least one Adult ticket",
    "timestamp": "2025-09-15T21:40:22.465Z",
    "details": {
      "childTickets": 2,
      "adultTickets": 0
    }
  }
}
```

## API Documentation

The API includes comprehensive OpenAPI/Swagger documentation:

- **Interactive Docs**: <http://localhost:3000/api-docs> (when server is running)
- **OpenAPI Spec**: Available at `docs/openapi.yaml`
- **Docker Docs**: `docker-compose --profile docs up swagger-ui` → <http://localhost:8080>

### Curl Testing Guide

**For local development, use IPv6 to avoid port conflicts:**

```bash
# Health check
curl -6 http://localhost:3000/health

# Valid purchase
curl -6 -X POST http://localhost:3000/tickets/purchase \
  -H "Content-Type: application/json" \
  -d '{"accountId":1,"tickets":[{"type":"ADULT","quantity":2},{"type":"CHILD","quantity":1}]}'

# Invalid account ID
curl -6 -X POST http://localhost:3000/tickets/purchase \
  -H "Content-Type: application/json" \
  -d '{"accountId":0,"tickets":[{"type":"ADULT","quantity":1}]}'

# Child without adult (business rule violation)
curl -6 -X POST http://localhost:3000/tickets/purchase \
  -H "Content-Type: application/json" \
  -d '{"accountId":1,"tickets":[{"type":"CHILD","quantity":2}]}'

# Family with infant (infant free, no seat)
curl -6 -X POST http://localhost:3000/tickets/purchase \
  -H "Content-Type: application/json" \
  -d '{"accountId":1,"tickets":[{"type":"ADULT","quantity":2},{"type":"CHILD","quantity":1},{"type":"INFANT","quantity":1}]}'
```

**Troubleshooting**: If curl hangs on IPv4 (127.0.0.1), use the `-6` flag to force IPv6 (::1).

## Quick Start

### Prerequisites

- **Node.js 22.17.0+** (LTS) - Required for optimal performance
- **npm 10.x+** or yarn equivalent
- **Docker** (optional) - For containerized development and deployment

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/itshusi/cinema-tickets-node.git
cd cinema-tickets-node

# Install dependencies
npm install

# Build the project
npm run build

# Verify installation with tests
npm test
```

### 🐳 Docker Quick Start (Recommended)

Get up and running in seconds with Docker:

```bash
# Build and run production container
npm run docker:build
npm run docker:run

# Or use docker-compose for full environment
docker-compose up cinema-tickets

# For development with hot reload
docker-compose --profile dev up cinema-tickets-dev

# Include API documentation
docker-compose --profile docs up swagger-ui
```

The containerized application will be available at:

- **Production**: [http://localhost:3000](http://localhost:3000)
- **Development**: [http://localhost:3001](http://localhost:3001)
- **API Docs**: [http://localhost:8080](http://localhost:8080) (with docs profile)

### Available NPM Commands

| Command                 | Description                         | Usage             |
| ----------------------- | ----------------------------------- | ----------------- |
| `npm run build`         | Compile TypeScript to JavaScript    | Production builds |
| `npm run build:watch`   | Compile with file watching          | Development       |
| `npm test`              | Run full test suite with coverage   | CI/CD, validation |
| `npm run test:watch`    | Run tests in watch mode             | Development       |
| `npm run test:coverage` | Generate detailed coverage report   | Quality assurance |
| `npm run lint`          | Check code for style/quality issues | Pre-commit        |
| `npm run lint:fix`      | Auto-fix linting issues             | Code cleanup      |
| `npm run format`        | Format code with Prettier           | Code cleanup      |
| `npm run format:check`  | Check if code is properly formatted | CI/CD             |
| `npm run dev`           | Start development mode              | Development       |
| `npm run clean`         | Remove build artifacts              | Cleanup           |
| `npm run docker:build`  | Build Docker production image       | Deployment        |
| `npm run docker:run`    | Run Docker container                | Local testing     |

### Development Workflow

```bash
# Start development environment
npm run build:watch &
npm run test:watch

# Or use Docker for isolated development
docker-compose --profile dev up

# Code quality checks
npm run lint && npm run format:check && npm test
```

## Project Structure

```text
cinema-tickets/
├── src/
│   ├── app.ts                        # Express API server setup
│   ├── pairtest/
│   │   ├── TicketService.ts          # Main service implementation
│   │   ├── interfaces/
│   │   │   └── TicketServiceApi.ts   # Service contracts
│   │   └── lib/
│   │       ├── InvalidPurchaseException.ts
│   │       └── TicketTypeRequest.ts   # Immutable ticket request
│   ├── controllers/
│   │   └── TicketController.ts       # API request handlers
│   ├── routes/
│   │   └── tickets.ts                # Express route definitions
│   ├── adapters/
│   │   └── ServiceAdapters.ts        # Third-party service wrappers
│   ├── types/
│   │   ├── TicketTypes.ts            # Business types and constants
│   │   ├── ApiTypes.ts               # API request/response types
│   │   ├── ThirdParty.ts             # Third-party service types
│   │   ├── global.d.ts               # Global type declarations
│   │   └── thirdparty.d.ts           # Legacy type definitions
│   └── thirdparty/                   # External service implementations
│       ├── paymentgateway/
│       │   └── TicketPaymentService.js
│       └── seatbooking/
│           └── SeatReservationService.js
├── test/
│   └── unit/                         # Comprehensive test suite
│       ├── TicketService.test.ts     # Domain logic tests
│       ├── TicketController.test.ts  # API layer tests
│       ├── TicketTypeRequest.test.ts # Value object tests
│       └── InvalidPurchaseException.test.ts # Exception tests
├── docs/
│   └── openapi.yaml                  # OpenAPI/Swagger specification
├── dist/                             # Compiled JavaScript output
├── coverage/                         # Test coverage reports
├── docker-compose.yml                # Multi-service Docker setup
├── Dockerfile                        # Production container definition
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
├── tsconfig.build.json               # Production build config
├── jest.config.mjs                   # Jest testing configuration
└── eslint.config.ts                  # ESLint configuration
```

## Usage Example

```typescript
import TicketService from "./src/pairtest/TicketService";
import TicketTypeRequest from "./src/pairtest/lib/TicketTypeRequest";
import TicketPaymentService from "./src/thirdparty/paymentgateway/TicketPaymentService";
import SeatReservationService from "./src/thirdparty/seatbooking/SeatReservationService";

// Initialize external services
const paymentService = new TicketPaymentService();
const seatService = new SeatReservationService();

// Create ticket service
const ticketService = new TicketService(paymentService, seatService);

// Create ticket requests
const adultTickets = new TicketTypeRequest("ADULT", 2);
const childTickets = new TicketTypeRequest("CHILD", 1);
const infantTickets = new TicketTypeRequest("INFANT", 1);

// Purchase tickets
try {
  ticketService.purchaseTickets(
    12345, // Account ID
    adultTickets,
    childTickets,
    infantTickets
  );
  console.log("Tickets purchased successfully!");
} catch (error) {
  console.error("Purchase failed:", error.message);
}
```

## Testing

The project includes comprehensive test coverage with **76 tests** covering both domain logic and API layer, achieving **96.72% statements** and **90.62% branches** coverage for the critical TicketService domain layer.

### Test Coverage Breakdown

- **Core Business Logic**: 96%+ coverage (TicketService, TicketTypeRequest, InvalidPurchaseException)
- **API Layer**: Comprehensive controller tests with full HTTP layer coverage
- **Overall Project**: 76 passing tests across all business scenarios and API endpoints

The project includes both domain logic tests and API layer tests for complete coverage.

### Test Categories

- **Account ID Validation**: Ensures only valid positive integers are accepted
- **Ticket Quantity Limits**: Validates 25-ticket maximum constraint
- **Adult Ticket Requirements**: Enforces adult supervision rules
- **Payment Calculations**: Verifies correct pricing for all scenarios
- **Seat Reservations**: Tests seat allocation logic (excludes infants)
- **Error Handling**: Covers service failures and edge cases
- **Complex Scenarios**: Real-world use cases (families, school trips, etc.)
- **HTTP Layer Tests**: Request validation, error responses, status codes
- **External Service Failures**: Payment and seat reservation error handling

### Test Stats

- **Total Tests**: 76 tests across 4 test suites
- **Core Domain Coverage**: 96%+ (TicketService, TicketTypeRequest, InvalidPurchaseException)
- **API Layer Coverage**: Complete HTTP controller testing
- **Test Files**: TicketService.test.ts, TicketController.test.ts, TicketTypeRequest.test.ts, InvalidPurchaseException.test.ts
- **Testing Approach**: Unit tests for domain logic, integration-style tests for API layer

### Running Specific Tests

```bash
# Run specific test file
npm test -- test/unit/TicketController.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="validation"

# Run with verbose output
npm test -- --verbose
```

## Professional Implementation Features

This implementation goes beyond the basic exercise requirements to demonstrate production-ready code:

### Clean Architecture & Best Practices

- **Single Responsibility**: Each function has one clear purpose with descriptive names
- **Separation of Concerns**: Controller handles HTTP, Service handles domain logic
- **Professional Naming**: Self-documenting method names eliminate need for excessive comments
- **Type Safety**: Comprehensive TypeScript with strict mode throughout

### Robust Error Handling

- **Proper HTTP Status Codes**: 400 Bad Request, 422 Unprocessable Entity, 402 Payment Required, 503 Service Unavailable
- **Structured Error Responses**: Consistent format with type, code, message, timestamp, and details
- **External Service Protection**: Graceful handling of payment and seat reservation failures
- **User-Friendly Messages**: Clear error descriptions without exposing internals

### Comprehensive Testing Strategy

- **Domain Logic**: 96%+ coverage with extensive business rule scenarios
- **API Layer**: Complete HTTP controller testing with mocking
- **Negative Cases**: Thorough testing of error conditions and edge cases
- **Real-World Scenarios**: Family purchases, validation errors, service failures

### Production-Ready Deployment

- **Docker Excellence**: Multi-stage builds, health checks, security best practices
- **Development Workflow**: Hot reload, watch modes, automated formatting
- **CI/CD Ready**: Automated testing, linting, and build processes
- **Documentation**: Interactive OpenAPI/Swagger with detailed examples

## Architecture

### Core Components

#### TicketService

The main service class that orchestrates the ticket purchasing process:

- Validates input parameters
- Applies business rules
- Calculates totals
- Coordinates with external services

#### TicketTypeRequest

An immutable value object representing a ticket request:

- Encapsulates ticket type and quantity
- Provides type safety and validation
- Cannot be modified after creation

#### InvalidPurchaseException

Custom exception for business rule violations:

- Provides clear error messages
- Distinguishes business logic errors from system errors

### External Integrations

- **TicketPaymentService**: Handles payment processing
- **SeatReservationService**: Manages seat bookings

## Business Logic Flow

1. **Input Validation**
   - Account ID must be positive integer
   - At least one ticket must be requested
   - Individual ticket quantities must be positive

2. **Business Rule Validation**
   - Total tickets ≤ 25
   - Child/Infant tickets require Adult tickets
   - No zero-ticket purchases

3. **Calculation**
   - Total payment amount (infants free)
   - Total seats needed (infants don't need seats)

4. **External Service Calls**
   - Process payment
   - Reserve seats

## Error Handling

The system handles various error scenarios:

### Validation Errors

- Invalid account IDs
- Exceeding ticket limits
- Missing adult supervision
- Zero or negative quantities

### Service Failures

- Payment gateway unavailable
- Seat booking system down
- Unknown error types

### Example Error Messages

```text
"Account ID must be a positive integer"
"Cannot purchase more than 25 tickets at a time"
"Child and Infant tickets cannot be purchased without Adult tickets"
"Payment processing failed: Payment gateway unavailable"
```

## Docker & Deployment

### Container Configuration

- **Multi-stage build** for optimized production images
- **Node.js 22 Alpine** base for minimal footprint
- **Security best practices** with non-root user
- **Automatic health checks** with API endpoint monitoring
- **Production dependencies only** for smaller image size

#### Docker Compose Services

```yaml
# Production service (default)
docker-compose up cinema-tickets

# Development service with hot reload
docker-compose --profile dev up cinema-tickets-dev

# API documentation service
docker-compose --profile docs up swagger-ui
```

**Service Details:**

- **cinema-tickets**: Production-ready container on port 3000
- **cinema-tickets-dev**: Development container on port 3001 with hot reload
- **swagger-ui**: API docs served at [http://localhost:8080](http://localhost:8080) (enable with `--profile docs`)
- **Health checks**: Automatic container health monitoring with `/health` endpoint
- **Networks**: Isolated cinema-tickets-network for security
- **Profiles**: Environment-specific service activation

#### Docker Health Checks

Both Dockerfile and docker-compose include sophisticated health checks:

```bash
# Container health check (every 30s)
node -e "fetch('http://127.0.0.1:3000/health').then(r=>r.ok?r.json():Promise.reject()).then(j=>{if(j&&j.status==='OK'){process.exit(0)}else{process.exit(1)}}).catch(()=>process.exit(1))"

# Check container health status
docker ps  # Shows health status
docker-compose ps  # Shows service health
```

### Environment Configuration

| Environment     | Port | Purpose               | Command                           |
| --------------- | ---- | --------------------- | --------------------------------- |
| **Production**  | 3000 | Optimized runtime     | `docker-compose up`               |
| **Development** | 3001 | Hot reload, debugging | `docker-compose --profile dev up` |
| **Testing**     | -    | CI/CD, validation     | `npm test`                        |

### TypeScript

- Strict mode enabled
- ES2024 target
- ESNext modules
- Comprehensive type checking

### ESLint

- TypeScript ESLint rules
- Prettier integration
- Type-aware linting
- Custom rules for code quality

### Jest

- TypeScript support via ts-jest
- Coverage thresholds: 90% minimum
- ESM module support
- Comprehensive test matching

## Build & Deployment

### Build Process

```bash
# Clean previous build
npm run clean

# Build TypeScript to JavaScript
npm run build

# Build with watch mode
npm run build:watch
```

### Output

- Compiled JavaScript in `dist/` directory
- Type declarations (`.d.ts` files)
- Source maps for debugging

## Contributing

### Code Standards

- Follow TypeScript strict mode
- Use Prettier for formatting
- Pass all ESLint rules
- Maintain test coverage above 90%
- Write descriptive commit messages

---

## Code Quality Metrics

- **Test Coverage**: 76 comprehensive tests with 96%+ domain logic coverage
- **HTTP Layer**: Complete controller testing with proper error handling
- **TypeScript**: Strict mode with comprehensive typing and ESM support
- **Linting**: Zero ESLint violations with consistent formatting
- **Architecture**: Clean separation of concerns (domain, API, adapters)
- **Docker**: Production-ready containerization with health checks
- **Error Handling**: Professional HTTP status codes and structured responses

---

_Built with TypeScript, Jest, and modern development practices._
