import crypto from "crypto";
import { RequestHandler } from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import QueueModel, { PopulatedQueue, Queue } from "../models/queue";
import { CreateQueueBody } from "../validation/queues";

export const createQueue: RequestHandler<
  unknown,
  unknown,
  CreateQueueBody,
  unknown
> = async (req, res, next) => {
  const { doctorId, clinicDocument } = req.body;
  try {
    const code = crypto.randomInt(100000, 999999).toString();
    const newQueue = await QueueModel.create({
      code,
      doctorId,
      clinicDocument,
    });

    return res.status(201).json(newQueue);
  } catch (error) {
    next(error);
  }
};

interface getQueueParams {
  code?: string;
}

export const getQueue: RequestHandler<
  getQueueParams,
  unknown,
  unknown,
  unknown
> = async (req, res, next) => {
  const { code } = req.params;
  try {
    const queue = await QueueModel.aggregate([
      {
        $match: { code },
      },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "users",
        },
      },
    ]);

    return res.status(200).json(queue[0]);
  } catch (error) {
    next(error);
  }
};

interface addToQueueParams {
  code?: string;
}

interface addToQueueBody {
  userId: mongoose.Types.ObjectId;
}

export const addToQueue: RequestHandler<
  addToQueueParams,
  unknown,
  addToQueueBody,
  unknown
> = async (req, res, next) => {
  const { userId } = req.body;
  const { code } = req.params;
  try {
    const queue = await QueueModel.findOne({ code });

    if (!queue) throw createHttpError(404, "Queue not found");
    queue.users = [...queue.users, userId];
    await queue.save();
    const queueToReturn = await QueueModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(queue._id) },
      },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "users",
        },
      },
    ]);
    return res.status(200).json({ queue: queueToReturn[0] });
  } catch (error) {
    next(error);
  }
};

export const getAllQueuesCodes: RequestHandler = async (req, res, next) => {
  try {
    const results = await QueueModel.find().select("code").exec();
    const codes = results.map((post) => post.code);
    res.status(200).json(codes);
  } catch (error) {
    next(error);
  }
};

interface GetQueuesByUserParams {
  userId?: string;
}

export const getQueuesByUser: RequestHandler<
  GetQueuesByUserParams,
  unknown,
  unknown,
  unknown
> = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const queues = await QueueModel.aggregate([
      {
        $match: {
          $or: [
            { users: { $in: [new mongoose.Types.ObjectId(userId)] } },
            { doctorId: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "users",
        },
      },
    ]);
    res.status(200).json(queues);
  } catch (error) {
    next(error);
  }
};

interface GetQueuesRecepcionistaParams {
  clinicDocument?: string;
}

export const getQueuesRecepcionista: RequestHandler<
  GetQueuesRecepcionistaParams,
  unknown,
  unknown,
  unknown
> = async (req, res, next) => {
  try {
    const { clinicDocument } = req.params;
    const queuesAggregate: PopulatedQueue[] = await QueueModel.aggregate([
      {
        $match: { clinicDocument },
      },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "users",
        },
      },
    ]);
    const queues: Queue[] = [];

    const rawQueues = await QueueModel.find({
      _id: {
        $in: [queuesAggregate.map((queue) => queue._id)],
      },
    });

    queuesAggregate.forEach((queueAgg) => {
      const currentQueue = rawQueues.find((queue) =>
        queue._id.equals(queueAgg._id)
      );

      if (currentQueue) {
        const usersOrder = currentQueue.users.filter(
          (id) =>
            !id.equals(
              new mongoose.Types.ObjectId("000000000000000000000000") ||
                id !== new mongoose.Types.ObjectId("000000000000000000000000")
            )
        );

        const mapUsers = usersOrder?.map((userId) => {
          const index = queueAgg.users.findIndex((queueUser) =>
            queueUser._id.equals(userId)
          );
          const user = queueAgg.users[index];
          return user;
        });

        queues.push({
          ...queueAgg,
          users: mapUsers?.filter((user) => user) ?? [],
        });
      }
    });
    res.status(200).json(queues);
  } catch (error) {
    next(error);
  }
};

interface RemoveFromeueParams {
  code?: string;
}

interface RemoveFromQueueBody {
  userId: mongoose.Types.ObjectId;
}

export const removeFromQueue: RequestHandler<
  RemoveFromeueParams,
  unknown,
  RemoveFromQueueBody,
  unknown
> = async (req, res, next) => {
  const { userId } = req.body;
  const { code } = req.params;
  try {
    const queue = await QueueModel.findOne({ code });

    if (!queue) throw createHttpError(404, "Queue not found");
    queue.users = queue.users.filter((user) => !user._id.equals(userId));

    await queue.save();
    return res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

interface GetQueuesDoctorParams {
  userId?: string;
}

export const getQueuesDoctor: RequestHandler<
  GetQueuesDoctorParams,
  unknown,
  unknown,
  unknown
> = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const queuesAggregate: PopulatedQueue[] = await QueueModel.aggregate([
      {
        $match: { doctorId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "users",
        },
      },
    ]);

    const queues: Queue[] = [];

    const rawQueues = await QueueModel.find({
      _id: {
        $in: [queuesAggregate.map((queue) => queue._id)],
      },
    });

    queuesAggregate.forEach((queueAgg) => {
      const currentQueue = rawQueues.find((queue) =>
        queue._id.equals(queueAgg._id)
      );

      if (currentQueue) {
        const usersOrder = currentQueue.users.filter(
          (id) =>
            !id.equals(
              new mongoose.Types.ObjectId("000000000000000000000000") ||
                id !== new mongoose.Types.ObjectId("000000000000000000000000")
            )
        );

        const mapUsers = usersOrder?.map((userId) => {
          const index = queueAgg.users.findIndex((queueUser) =>
            queueUser._id.equals(userId)
          );
          const user = queueAgg.users[index];
          return user;
        });

        queues.push({
          ...queueAgg,
          users: mapUsers?.filter((user) => user) ?? [],
        });
      }
    });

    res.status(200).json(queues);
  } catch (error) {
    next(error);
  }
};

interface EndAppointmentParams {
  queueId?: string;
}

export const endAppointment: RequestHandler<
  EndAppointmentParams,
  unknown,
  unknown,
  unknown
> = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    const queue = await QueueModel.findById(queueId);

    if (!queue) {
      return res.status(404).json({ error: "Queue not found" });
    }

    if (queue.users && queue.users.length > 0) {
      queue.users = queue.users.slice(1);
    }

    await queue.save();

    res.status(200).json(queue);
  } catch (error) {
    next(error);
  }
};
