import EmailVerificationTokenModel, {
  EmailVerificationToken,
} from "../models/emailVerificationToken";

export interface IEmailVerificationTokenRepository {
  findVerificationToken(
    email: string,
    verificationCode: string
  ): Promise<EmailVerificationToken | null>;
}

export default class EmailVerificationTokenRepository
  implements IEmailVerificationTokenRepository
{
  async findVerificationToken(email: string, verificationCode: string) {
    const emailVerificationToken = await EmailVerificationTokenModel.findOne({
      email,
      verificationCode,
    }).exec();

    return emailVerificationToken;
  }
}
