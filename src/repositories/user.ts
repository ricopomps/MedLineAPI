import createHttpError from "http-errors";
import mongoose from "mongoose";
import UserModel, { User } from "../models/user";
import { UpdateUserBody } from "../validation/users";

export interface IUserRepository {
  findUserById(
    userId: mongoose.Types.ObjectId,
    extraFields?: string
  ): Promise<User>;

  findUserByUsername(username: string): Promise<User | null>;

  createUser(
    username: string,
    email: string,
    passwordHashed: string
  ): Promise<User>;

  updateUser(
    userId: mongoose.Types.ObjectId,
    { username, displayName, about }: UpdateUserBody,
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

  async findUserByUsername(username: string): Promise<User | null> {
    const user = await UserModel.findOne({ username })
      .collation({
        locale: "en",
        strength: 2,
      })
      .exec();

    return user;
  }

  async createUser(username: string, email: string, passwordHashed: string) {
    const result = await UserModel.create({
      username,
      displayName: username,
      email,
      password: passwordHashed,
    });

    const userWithoutPassword = result.toObject();
    delete userWithoutPassword.password;

    return userWithoutPassword;
  }

  async updateUser(
    userId: mongoose.Types.ObjectId,
    { username, displayName, about }: UpdateUserBody,
    profilePicDestinationPath?: string
  ): Promise<User> {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...(username && { username }),
          ...(displayName && { displayName }),
          ...(about && { about }),
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
