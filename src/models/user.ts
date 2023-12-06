import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    cpf: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true, select: false },
    password: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true, select: false },
    githubId: { type: String, unique: true, sparse: true, select: false },
  },
  { timestamps: true }
);

userSchema.pre("validate", function (next) {
  if (!this.email && !this.googleId && !this.githubId) {
    return next(new Error("User must have an email or social provider id"));
  }
  next();
});

export type User = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export default model<User>("User", userSchema);
