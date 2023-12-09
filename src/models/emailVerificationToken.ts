import { InferSchemaType, Schema, model } from "mongoose";

const emailVertificationTokenSchema = new Schema({
  email: { type: String, required: true },
  verificationCode: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: "10m" },
});

export type EmailVerificationToken = InferSchemaType<
  typeof emailVertificationTokenSchema
>;

export default model<EmailVerificationToken>(
  "EmailVerificationToken",
  emailVertificationTokenSchema
);
