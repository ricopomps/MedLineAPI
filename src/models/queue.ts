import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const queueSchema = new Schema(
  {
    code: { type: String, unique: true, required: true },
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    doctorId: { type: Schema.Types.ObjectId, ref: "User" },
    clinicDocument: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export type Queue = InferSchemaType<typeof queueSchema> & {
  _id: mongoose.Types.ObjectId;
};

export default model<Queue>("Queue", queueSchema);
