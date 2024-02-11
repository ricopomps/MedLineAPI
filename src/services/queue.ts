import { PopulatedQueue, Queue, QueueStatus } from "../models/queue";
import { User } from "../models/user";
import QueueRepository, { IQueueRepository } from "../repositories/queue";

export interface IQueueService {
  changeQueueStatus(queueCode: string, status: QueueStatus): Promise<Queue>;

  finishAppointment(queueCode: string): Promise<Queue>;

  setQueueToWaitingNextAppointment(queueCode: string): Promise<Queue>;

  getUsersFromQueue(queueCode: string): Promise<User[]>;

  addUserToQueue(queueCode: string, userId: string): Promise<PopulatedQueue>;
}

export default class QueueService implements IQueueService {
  private queueRepository: IQueueRepository;

  constructor() {
    this.queueRepository = new QueueRepository();
  }

  async changeQueueStatus(queueCode: string, status: QueueStatus) {
    return this.queueRepository.changeQueueStatus(queueCode, status);
  }

  async finishAppointment(queueCode: string) {
    await this.queueRepository.clearFirstInQueue(queueCode);
    return await this.changeQueueStatus(queueCode, QueueStatus.done);
  }

  async setQueueToWaitingNextAppointment(queueCode: string) {
    await this.queueRepository.removeFirstInQueue(queueCode);
    return await this.changeQueueStatus(queueCode, QueueStatus.waiting);
  }

  async getUsersFromQueue(queueCode: string) {
    const queue = await this.queueRepository.getQueue(queueCode);
    return queue.users;
  }

  async addUserToQueue(
    queueCode: string,
    userId: string
  ): Promise<PopulatedQueue> {
    return await this.queueRepository.addUserToQueue(queueCode, userId);
  }
}
