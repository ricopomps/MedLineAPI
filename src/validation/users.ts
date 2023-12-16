import * as yup from "yup";
import { UserType } from "../models/user";

const cpfSchema = yup
  .string()
  .required("CPF obrigatório")
  .test("is-valid-cpf", "CPF inválido", (value) => {
    return isValidCPF(value);
  })
  .length(11, "CPF deve ter 11 caracteres");

function isValidCPF(cpf: string) {
  const numbers = cpf.split("").map(Number);

  if (new Set(numbers).size === 1) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += numbers[i] * (10 - i);
  }
  let mod = sum % 11;
  const firstDigit = mod < 2 ? 0 : 11 - mod;

  if (firstDigit !== numbers[9]) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += numbers[i] * (11 - i);
  }
  mod = sum % 11;
  const secondDigit = mod < 2 ? 0 : 11 - mod;

  return secondDigit === numbers[10];
}

const emailSchema = yup.string().email("Inserir e-mail válido");

const passwordSchema = yup
  .string()
  .matches(/^(?!.* )/, "Senha não pode ter espaços em branco")
  .min(6, "Senha deve ter no mínimo 6 caracteres");

const displayNameSchema = yup.string().max(50);

const userTypeSchema = yup
  .string()
  .oneOf(Object.values(UserType), "Invalid user type");

export const signUpSchema = yup.object({
  body: yup.object({
    cpf: cpfSchema.required(),
    email: emailSchema.required(),
    name: displayNameSchema.required("Nome é obrigatório"),
    password: passwordSchema.required(),
    verificationCode: yup.string().required("Código é obrigatório"),
    userType: userTypeSchema.required(),
  }),
});

export type SignUpBody = yup.InferType<typeof signUpSchema>["body"];

export const updateUserSchema = yup.object({
  body: yup.object({
    name: displayNameSchema,
  }),
});

export type UpdateUserBody = yup.InferType<typeof updateUserSchema>["body"];

export const requestVerificationCodeSchema = yup.object({
  body: yup.object({
    email: emailSchema.required(),
  }),
});

export type requestVerificationCodeBody = yup.InferType<
  typeof requestVerificationCodeSchema
>["body"];

export const resetPasswordSchema = yup.object({
  body: yup.object({
    email: emailSchema.required(),
    password: passwordSchema.required(),
    verificationCode: yup.string().required(),
  }),
});

export type ResetPasswordBody = yup.InferType<
  typeof resetPasswordSchema
>["body"];
