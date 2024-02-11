import createHttpError from "http-errors";
import mongoose from "mongoose";
import QueueModel, {
  PopulatedQueue,
  Queue,
  QueueStatus,
} from "../models/queue";

export interface IQueueRepository {
  changeQueueStatus(queueCode: string, status: QueueStatus): Promise<Queue>;

  clearFirstInQueue(queueCode: string): Promise<void>;

  removeFirstInQueue(queueCode: string): Promise<void>;

  getQueue(queueCode: string): Promise<PopulatedQueue>;

  addUserToQueue(queueCode: string, userId: string): Promise<PopulatedQueue>;
}

export default class QueueRepository implements IQueueRepository {
  async changeQueueStatus(
    queueCode: string,
    status: QueueStatus
  ): Promise<Queue> {
    const result = await QueueModel.updateOne(
      { code: queueCode },
      {
        status,
      }
    );
    if (result.modifiedCount === 0)
      throw createHttpError(400, "Queue not found");
    const updatedQueue = await QueueModel.findOne({ code: queueCode });
    if (!updatedQueue) throw createHttpError(404, "Queue not found");

    return updatedQueue;
  }

  async clearFirstInQueue(queueCode: string) {
    const queue = await QueueModel.findOne({ code: queueCode });
    if (queue && queue.users.length > 0) {
      queue.users[0] = new mongoose.Types.ObjectId("000000000000000000000000");

      await QueueModel.updateOne({ code: queueCode }, { users: queue.users });
    }
  }

  async removeFirstInQueue(queueCode: string) {
    const queue = await QueueModel.findOne({ code: queueCode });
    if (queue && queue.users.length > 0) {
      queue.users.shift();

      await QueueModel.updateOne({ code: queueCode }, { users: queue.users });
    }
  }

  async getQueue(queueCode: string) {
    const queue = await QueueModel.aggregate([
      {
        $match: { code: queueCode },
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
    return queue[0];
  }

  async addUserToQueue(
    queueCode: string,
    userId: string
  ): Promise<PopulatedQueue> {
    const queue = await QueueModel.findOne({ code: queueCode });
    if (!queue) throw createHttpError(404, "Queue not found");
    queue.users = [...queue.users, new mongoose.Types.ObjectId(userId)];
    await queue.save();
    return this.getQueue(queueCode);
  }
}
