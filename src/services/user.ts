import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { User } from "../models/user";
import EmailVerificationTokenRepository, {
  IEmailVerificationTokenRepository,
} from "../repositories/emailVerificationToken";
import UserRepository, { IUserRepository } from "../repositories/user";
import { SignUpBody, UpdateUserBody } from "../validation/users";

export interface IUserService {
  getAuthenticatedUser(userId: mongoose.Types.ObjectId): Promise<User>;

  signUp(body: SignUpBody): Promise<User>;

  findUserByUsername(username: string): Promise<User | null>;

  updateUser(
    userId: mongoose.Types.ObjectId,
    body: UpdateUserBody
  ): Promise<User>;
}

export default class UserService implements IUserService {
  private userRepository: IUserRepository;
  private emailVerificationTokenRepository: IEmailVerificationTokenRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.emailVerificationTokenRepository =
      new EmailVerificationTokenRepository();
  }

  async getAuthenticatedUser(userId: mongoose.Types.ObjectId) {
    const user = await this.userRepository.findUserById(userId, "+email");
    return user;
  }

  async signUp({
    email,
    password: passwordRaw,
    username,
    verificationCode,
  }: SignUpBody) {
    const existingUsername = await this.userRepository.findUserByUsername(
      email
    );

    if (existingUsername) throw createHttpError(409, "Username already taken");

    const emailVerificationToken =
      await this.emailVerificationTokenRepository.findVerificationToken(
        email,
        verificationCode
      );

    if (!emailVerificationToken)
      throw createHttpError(400, "Verification code incorrect or expired.");

    const passwordHashed = await bcrypt.hash(passwordRaw, 10);

    const newUser = await this.userRepository.createUser(
      username,
      email,
      passwordHashed
    );

    return newUser;
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findUserByUsername(username);
  }

  async updateUser(
    userId: mongoose.Types.ObjectId,
    { username, displayName, about }: UpdateUserBody
  ): Promise<User> {
    if (username) {
      const existingUsername = await this.userRepository.findUserByUsername(
        username
      );

      if (existingUsername)
        throw createHttpError(409, "Username already taken");
    }

    const updatedUser = await this.userRepository.updateUser(userId, {
      username,
      displayName,
      about,
    });

    return updatedUser;
  }
}
