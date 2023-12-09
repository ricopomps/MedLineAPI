import mongoose from "mongoose";
import * as yup from "yup";

export const objectIdSchema = yup
  .string()
  .test(
    "is-objectid",
    "${path} is not a valid ObjectId",
    (value) => !value || mongoose.Types.ObjectId.isValid(value)
  );
