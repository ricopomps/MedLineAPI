import crypto from "crypto";
import { RequestHandler } from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import QueueModel from "../models/queue";
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
    console.log("AHHHHHHHHHHHHHHHHHHHHHH", code, clinicDocument);
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
    return res.status(200).json({ queue });
  } catch (error) {
    next(error);
  }
};

export const getAllQueuesCodes: RequestHandler = async (req, res, next) => {
  try {
    const results = await QueueModel.find().select("code").exec();
    console.log(results);
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
    const queues = await QueueModel.find({
      $or: [{ users: { $in: [userId] } }, { doctorId: userId }],
    }).exec();
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
    const queues = await QueueModel.aggregate([
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

    const queues = await QueueModel.aggregate([
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
