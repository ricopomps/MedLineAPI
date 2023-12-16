import createHttpError from "http-errors";
import { createTransport } from "nodemailer";
import env from "../env";

const transporter = createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

export async function sendVerificationCode(
  toEmail: string,
  verificationCode: string
) {
  try {
    await transporter.sendMail({
      from: env.SMTP_SENDER,
      to: toEmail,
      subject: "Your verification code",
      html: `<p>This is your verification code. It will expire in 10 minutes.</p><strong>${verificationCode}</strong>`,
    });
  } catch (error) {
    console.error(error);
    throw createHttpError(500, "Error in sending the e-mail");
  }
}

export async function sendPasswordResetCode(
  toEmail: string,
  verificationCode: string
) {
  try {
    await transporter.sendMail({
      from: env.SMTP_SENDER,
      to: toEmail,
      subject: "Reset you password",
      html: `<p>A password reset request has been sent for this account.
              Use this verification code to reset your password.
              It will expire in 10 minutes.</p>
              <p><strong>${verificationCode}</strong></p>
              If you didn't request a password reset, ignore this email.`,
    });
  } catch (error) {
    console.error(error);
    throw createHttpError(500, "Error in sending the e-mail");
  }
}
