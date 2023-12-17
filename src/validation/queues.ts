import * as yup from "yup";
import { cnpjSchema } from "./users";
const objectIdSchema = yup
  .string()
  .matches(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createQueueBodySchema = yup.object({
  body: yup.object({
    doctorId: objectIdSchema.required("ObjectId is required"),
    clinicDocument: cnpjSchema,
  }),
});

export type CreateQueueBody = yup.InferType<
  typeof createQueueBodySchema
>["body"];
