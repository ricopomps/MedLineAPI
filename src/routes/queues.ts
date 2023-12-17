import express from "express";
import * as QueuesController from "../controllers/queue";
import requiresAuth from "../middlewares/requiresAuth";
import validateRequestSchema from "../middlewares/validateRequestSchema";
import { createQueueBodySchema } from "../validation/queues";

const router = express.Router();

router.post(
  "/",
  requiresAuth,
  validateRequestSchema(createQueueBodySchema),
  QueuesController.createQueue
);

router.get("/codes", QueuesController.getAllQueuesCodes);

router.get(
  "/:code",
  // requiresAuth,
  QueuesController.getQueue
);

router.post(
  "/:code",
  // requiresAuth,
  QueuesController.addToQueue
);

router.get("/user/:userId", requiresAuth, QueuesController.getQueuesByUser);

router.get(
  "/recepcionista/:clinicDocument",
  requiresAuth,
  QueuesController.getQueuesRecepcionista
);

export default router;
