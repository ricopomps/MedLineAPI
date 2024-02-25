import { io } from "./app";
import { QueueStatus } from "./models/queue";
import QueueService from "./services/queue";

enum Events {
  enterQueue = "ENTER_QUEUE",
  viewQueue = "VIEW_QUEUE",
  queueStatusChanged = "QUEUE_STATUS_CHANGED",
  startAppointment = "START_APPOINTMENT",
  endAppointment = "END_APPOINTMENT",
  setQueueReady = "SET_QUEUE_READY",
  setQueueWaiting = "SET_QUEUE_WAITING",
  clearFirstUserInQueue = "CLEAR_FIRST_USER_IN_QUEUE",
  removeFirstUserInQueue = "REMOVE_FIRST_USER_IN_QUEUE",
  queueUsersChanged = "QUEUE_USER_CHANGED",
  userEnteredQueue = "USER_ENTERED_QUEUE",
  userLeftQueue = "USER_LEFT_QUEUE",
  removeFromQueue = "REMOVE_FROM_QUEUE",
}

interface OnQueueUser {
  socket_id: string;
  userId: string;
  username: string;
  queueCode: string;
}
const queueService = new QueueService();
const users: OnQueueUser[] = [];

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);
  try {
    socket.on(
      Events.enterQueue,
      async (data: { queueCode: string; userId: string }) => {
        socket.join(data.queueCode);

        const queue = await queueService.addUserToQueue(
          data.queueCode,
          data.userId
        );
        io.to(data.queueCode).emit(Events.queueUsersChanged, {
          users: queue.users,
          queueCode: data.queueCode,
        });
        io.to(data.queueCode).emit(Events.userEnteredQueue, {
          queue: queue,
        });
      }
    );

    socket.on(Events.viewQueue, (data) => {
      socket.join(data.queueCode);

      const userInQueue = users.find((user) => user.userId === data.userId);

      if (userInQueue) {
        userInQueue.socket_id = socket.id;
      } else {
        users.push({
          queueCode: data.queueCode,
          socket_id: socket.id,
          userId: data.userId,
          username: data.username,
        });
      }
    });

    socket.on(Events.startAppointment, (data) => {
      queueService.changeQueueStatus(data.queueCode, QueueStatus.inProgress);
      io.to(data.queueCode).emit(Events.queueStatusChanged, {
        queueCode: data.queueCode,
        status: QueueStatus.inProgress,
      });
    });

    socket.on(Events.endAppointment, async (data) => {
      await queueService.finishAppointment(data.queueCode);
      io.to(data.queueCode).emit(Events.queueStatusChanged, {
        queueCode: data.queueCode,
        status: QueueStatus.done,
      });
      const queueUsers = await queueService.getUsersFromQueue(data.queueCode);
      io.to(data.queueCode).emit(Events.queueUsersChanged, {
        users: queueUsers,
        queueCode: data.queueCode,
      });
      io.to(data.queueCode).emit(Events.userLeftQueue, {
        users: queueUsers,
        queueCode: data.queueCode,
      });
    });

    socket.on(Events.setQueueReady, (data) => {
      queueService.changeQueueStatus(data.queueCode, QueueStatus.ready);
      io.to(data.queueCode).emit(Events.queueStatusChanged, {
        queueCode: data.queueCode,
        status: QueueStatus.ready,
      });
    });

    socket.on(Events.setQueueWaiting, async (data) => {
      queueService.setQueueToWaitingNextAppointment(data.queueCode);
      io.to(data.queueCode).emit(Events.queueStatusChanged, {
        queueCode: data.queueCode,
        status: QueueStatus.waiting,
      });
      const queueUsers = await queueService.getUsersFromQueue(data.queueCode);
      io.to(data.queueCode).emit(Events.queueUsersChanged, {
        users: queueUsers,
        queueCode: data.queueCode,
      });
    });

    socket.on(Events.removeFromQueue, async (data) => {
      const queue = await queueService.removeUserFromQueue(
        data.queueCode,
        data.userId
      );
      io.to(data.queueCode).emit(Events.queueUsersChanged, {
        users: queue.users,
        queueCode: data.queueCode,
      });
      io.to(data.queueCode).emit(Events.userLeftQueue, {
        users: queue.users,
        queueCode: data.queueCode,
      });
    });
  } catch (error) {
    console.error(error);
  }
});
