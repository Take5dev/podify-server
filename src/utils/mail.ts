import { generateTemplate } from "@/mail/template";
import emailVerificationToken from "@/models/emailVerificationToken";
import {
  MAILTRAP_PASSWORD,
  MAILTRAP_USER,
  SIGN_IN_URL,
  VERIFICATION_EMAIL,
} from "@/utils/variables";
import nodemailer from "nodemailer";
import { Address } from "nodemailer/lib/mailer";
import path from "path";

const generateMailTransporter = () => {
  return nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: MAILTRAP_USER,
      pass: MAILTRAP_PASSWORD,
    },
  });
};

interface Profile {
  _id: string;
  name: string;
  email: string | Address | (string | Address)[] | undefined;
}

export const sendVerificationMail = async (token: string, profile: Profile) => {
  const transport = generateMailTransporter();

  const { _id, name, email } = profile;

  const welcomeMessage = `Hi ${name},<br /> welcome to Podify! Use the given OTP to verify your email.`;

  transport.sendMail({
    to: email,
    from: VERIFICATION_EMAIL,
    subject: "Welcome to Podify",
    html: generateTemplate({
      title: "Welcome to Podify",
      message: welcomeMessage,
      logo: "cid:logo",
      banner: "cid:welcome",
      link: "#",
      btnTitle: token,
    }),
    attachments: [
      {
        filename: "logo.png",
        path: path.join(__dirname, "../mail/images/logo.png"),
        cid: "logo",
      },
      {
        filename: "welcome.png",
        path: path.join(__dirname, "../mail/images/welcome.png"),
        cid: "welcome",
      },
    ],
  });
};

interface Options {
  email: string;
  link: string;
}

export const sendForgotPasswordMail = async (options: Options) => {
  const transport = generateMailTransporter();

  const { email, link } = options;

  transport.sendMail({
    to: email,
    from: VERIFICATION_EMAIL,
    subject: "Forgot your password?",
    html: generateTemplate({
      title: "Forgot your password?",
      message: `We've received a request to change your password. Follow the link below to change your password.`,
      logo: "cid:logo",
      banner: "cid:fp",
      link,
      btnTitle: "Reset your password",
    }),
    attachments: [
      {
        filename: "logo.png",
        path: path.join(__dirname, "../mail/images/logo.png"),
        cid: "logo",
      },
      {
        filename: "forget_password.png",
        path: path.join(__dirname, "../mail/images/forget_password.png"),
        cid: "fp",
      },
    ],
  });
};

export const sendUpdatedPasswordMail = async (name: string, email: string) => {
  const transport = generateMailTransporter();

  transport.sendMail({
    to: email,
    from: VERIFICATION_EMAIL,
    subject: "Password updated",
    html: generateTemplate({
      title: "Password updated",
      message: `Dear ${name},<br /> Your password was successfully updated.`,
      logo: "cid:logo",
      banner: "cid:fp",
      link: SIGN_IN_URL,
      btnTitle: "Sign In",
    }),
    attachments: [
      {
        filename: "logo.png",
        path: path.join(__dirname, "../mail/images/logo.png"),
        cid: "logo",
      },
      {
        filename: "forget_password.png",
        path: path.join(__dirname, "../mail/images/forget_password.png"),
        cid: "fp",
      },
    ],
  });
};
