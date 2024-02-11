import mongoose, { InferSchemaType, Schema, model } from "mongoose";
import { User } from "./user";

export enum QueueStatus {
  waiting = "aguardando", //waiting for patiant
  ready = "pronto", //doctor is ready to take a patient
  inProgress = "em progresso", //doctor is with a patient
  done = "finalizado", //Doctor finished with a patient
}

const queueSchema = new Schema(
  {
    code: { type: String, unique: true, required: true },
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    doctorId: { type: Schema.Types.ObjectId, ref: "User" },
    clinicDocument: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: QueueStatus.waiting,
      enum: Object.values(QueueStatus),
    },
  },
  { timestamps: true }
);

export type Queue = InferSchemaType<typeof queueSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type PopulatedQueue = Queue & {
  users: User[];
};
export default model<Queue>("Queue", queueSchema);
