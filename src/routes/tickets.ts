import express from "express";
import { TicketController } from "../controllers/TicketController.js";

const router = express.Router();

const ticketController = new TicketController();

/**
 * POST /tickets/purchase
 * Purchase cinema tickets
 */
router.post("/purchase", ticketController.purchaseTickets);

export default router;
