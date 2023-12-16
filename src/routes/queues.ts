import express from "express";
import * as QueuesController from "../controllers/queue";
// import requiresAuth from "../middlewares/requiresAuth";

const router = express.Router();

router.post(
  "/",
  // requiresAuth,
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

router.get(
  "/user/:userId",
  // requiresAuth,
  QueuesController.getQueuesByUser
);

export default router;
