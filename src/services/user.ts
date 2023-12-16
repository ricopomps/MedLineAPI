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

  findUserBycpf(cpf: string): Promise<User | null>;

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
    cpf,
    name,
    verificationCode,
    userType,
  }: SignUpBody) {
    const existingcpf = await this.userRepository.findUserBycpf(cpf);

    if (existingcpf) throw createHttpError(409, "cpf already taken");

    const emailVerificationToken =
      await this.emailVerificationTokenRepository.findVerificationToken(
        email,
        verificationCode
      );

    if (!emailVerificationToken)
      throw createHttpError(
        400,
        "Código de verificação incorreto ou expirado."
      );

    const passwordHashed = await bcrypt.hash(passwordRaw, 10);

    const newUser = await this.userRepository.createUser(
      cpf,
      email,
      name,
      userType,
      passwordHashed
    );

    return newUser;
  }

  async findUserBycpf(cpf: string): Promise<User | null> {
    return await this.userRepository.findUserBycpf(cpf);
  }

  async updateUser(
    userId: mongoose.Types.ObjectId,
    { name }: UpdateUserBody
  ): Promise<User> {
    const updatedUser = await this.userRepository.updateUser(userId, {
      name,
    });

    return updatedUser;
  }
}
