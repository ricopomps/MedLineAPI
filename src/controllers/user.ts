import crypto from "crypto";
import { RequestHandler } from "express";
import createHttpError from "http-errors";
import UserModel from "../models/user";
// import PasswordResetToken from "../models/passwordResetToken";
import EmailVerificationToken from "../models/emailVerificationToken";
import UserService, { IUserService } from "../services/user";
import assertIsDefined from "../utils/assertIsDefined";
import * as Email from "../utils/email";
// import { destroyAllActiveSesionsForUser } from "../utils/auth";
import {
  SignUpBody,
  UpdateUserBody,
  requestVerificationCodeBody,
} from "../validation/users";

// const fileService: IFileService = new FileService();
const userService: IUserService = new UserService();

export const getAuthenticatedUser: RequestHandler = async (req, res, next) => {
  const authenticatedUser = req.user;
  try {
    assertIsDefined(authenticatedUser);

    const user = await userService.getAuthenticatedUser(authenticatedUser._id);

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const signUp: RequestHandler<
  unknown,
  unknown,
  SignUpBody,
  unknown
> = async (req, res, next) => {
  const { username, email, password: passwordRaw, verificationCode } = req.body;
  try {
    const newUser = await userService.signUp({
      username,
      email,
      password: passwordRaw,
      verificationCode,
    });

    req.logIn(newUser, (error) => {
      if (error) throw error;
      res.status(201).json(newUser);
    });
  } catch (error) {
    next(error);
  }
};

export const logOut: RequestHandler = (req, res) => {
  req.logOut((error) => {
    if (error) throw error;
    res.sendStatus(200);
  });
};

export const getUserByUsername: RequestHandler = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await userService.findUserByUsername(username);

    if (!user) throw createHttpError(404, "User not found");

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser: RequestHandler<
  unknown,
  unknown,
  UpdateUserBody,
  unknown
> = async (req, res, next) => {
  const { username, displayName, about } = req.body;
  const authenticatedUser = req.user;
  try {
    assertIsDefined(authenticatedUser);

    const updatedUser = await userService.updateUser(authenticatedUser._id, {
      username,
      displayName,
      about,
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const requestEmailVerificationCode: RequestHandler<
  unknown,
  unknown,
  requestVerificationCodeBody,
  unknown
> = async (req, res, next) => {
  const { email } = req.body;
  try {
    const existingEmail = await UserModel.findOne({ email })
      .collation({
        locale: "en",
        strength: 2,
      })
      .exec();

    if (existingEmail) throw createHttpError(409, "Email already in use");

    const verificationCode = crypto.randomInt(100000, 999999).toString();

    await EmailVerificationToken.create({
      email,
      verificationCode,
    });

    await Email.sendVerificationCode(email, verificationCode);

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

// export const requestResetPasswordCode: RequestHandler<
//   unknown,
//   unknown,
//   requestVerificationCodeBody,
//   unknown
// > = async (req, res, next) => {
//   const { email } = req.body;
//   try {
//     const user = await UserModel.findOne({ email })
//       .collation({
//         locale: "en",
//         strength: 2,
//       })
//       .exec();

//     if (!user) throw createHttpError(404, "User does not exist");

//     const verificationCode = crypto.randomInt(100000, 999999).toString();

//     await PasswordResetToken.create({
//       email,
//       verificationCode,
//     });

//     await Email.sendPasswordResetCode(email, verificationCode);

//     res.sendStatus(200);
//   } catch (error) {
//     next(error);
//   }
// };

// export const resetPassword: RequestHandler<
//   unknown,
//   unknown,
//   ResetPasswordBody,
//   unknown
// > = async (req, res, next) => {
//   const { email, password: newPasswordRaw, verificationCode } = req.body;
//   try {
//     const existingUser = await UserModel.findOne({ email })
//       .select("+email")
//       .collation({
//         locale: "en",
//         strength: 2,
//       })
//       .exec();
//     if (!existingUser) throw createHttpError(404, "User not found");

//     const passwordResetToken = await PasswordResetToken.findOne({
//       email,
//       verificationCode,
//     }).exec();

//     if (!passwordResetToken)
//       throw createHttpError(400, "Verification code incorrect or expired.");
//     else await passwordResetToken.deleteOne();

//     await destroyAllActiveSesionsForUser(existingUser._id.toString());

//     const newPasswordHashed = await bcrypt.hash(newPasswordRaw, 10);

//     existingUser.password = newPasswordHashed;

//     await existingUser.save();

//     const user = existingUser.toObject();

//     delete user.password;

//     req.logIn(user, (error) => {
//       if (error) throw error;
//       res.status(200).json(user);
//     });
//   } catch (error) {
//     next(error);
//   }
// };
