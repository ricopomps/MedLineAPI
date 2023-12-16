import crypto from "crypto";
import { RequestHandler } from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import QueueModel from "../models/queue";

interface createQueueBody {
  doctorId: mongoose.Types.ObjectId;
}

export const createQueue: RequestHandler<
  unknown,
  unknown,
  createQueueBody,
  unknown
> = async (req, res, next) => {
  const { doctorId } = req.body;
  try {
    const code = crypto.randomInt(100000, 999999).toString();

    const newQueue = await QueueModel.create({
      code,
      doctorId,
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
    const queue = await QueueModel.findOne({
      code,
    });

    return res.status(200).json(queue);
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

interface getQueuesByUserParams {
  userId?: string;
}

export const getQueuesByUser: RequestHandler<
  getQueuesByUserParams,
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
