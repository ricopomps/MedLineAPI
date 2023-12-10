import createHttpError from "http-errors";
import mongoose from "mongoose";
import UserModel, { User, UserType } from "../models/user";
import { UpdateUserBody } from "../validation/users";

export interface IUserRepository {
  findUserById(
    userId: mongoose.Types.ObjectId,
    extraFields?: string
  ): Promise<User>;

  findUserBycpf(cpf: string): Promise<User | null>;

  createUser(
    cpf: string,
    email: string,
    name: string,
    userType: UserType,
    passwordHashed: string
  ): Promise<User>;

  updateUser(
    userId: mongoose.Types.ObjectId,
    { name }: UpdateUserBody,
    profilePicDestinationPath?: string
  ): Promise<User>;
}

export default class UserRepository implements IUserRepository {
  async findUserById(userId: mongoose.Types.ObjectId, extraFields?: string) {
    const user = await UserModel.findById(userId)
      .select(extraFields || "")
      .exec();

    if (!user) throw createHttpError(404, "User not found");

    return user;
  }

  async findUserBycpf(cpf: string): Promise<User | null> {
    const user = await UserModel.findOne({ cpf })
      .collation({
        locale: "en",
        strength: 2,
      })
      .exec();

    return user;
  }

  async createUser(
    cpf: string,
    email: string,
    name: string,
    userType: UserType,
    passwordHashed: string
  ) {
    const result = await UserModel.create({
      cpf,
      displayName: cpf,
      email,
      name,
      userType,
      password: passwordHashed,
    });

    const userWithoutPassword = result.toObject();
    delete userWithoutPassword.password;

    return userWithoutPassword;
  }

  async updateUser(
    userId: mongoose.Types.ObjectId,
    { name }: UpdateUserBody,
    profilePicDestinationPath?: string
  ): Promise<User> {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...(name && { name }),
          ...(profilePicDestinationPath && {
            profilePicUrl: `${profilePicDestinationPath}?lastupdated=${Date.now()}`,
          }),
        },
      },
      { new: true }
    ).exec();

    return updatedUser as User;
  }
}
