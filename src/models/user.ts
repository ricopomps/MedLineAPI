import mongoose, { InferSchemaType, Schema, model } from "mongoose";

export enum UserType {
  pacient = "paciente",
  recepcionista = "recepcionista",
  doctor = "doctor",
}

const userSchema = new Schema(
  {
    cpf: { type: String, unique: true, sparse: true },
    name: { type: String },
    email: { type: String, unique: true, sparse: true, select: false },
    clinicDocument: { type: String },
    password: { type: String, select: false },
    userType: {
      type: String,
      required: true,
      default: UserType.pacient,
      enum: Object.values(UserType),
    },
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
