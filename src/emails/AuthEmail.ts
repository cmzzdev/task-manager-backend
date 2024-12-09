import { transporter } from "../config/nodemailer";

interface IEmail {
  email: string;
  name: string;
  token: string;
}

export class AuthEmail {
  static sendConfirmationEmail = async (user: IEmail) => {
    const info = await transporter.sendMail({
      from: "Task Manager <admin@taskmanager.com>",
      to: user.email,
      subject: "Task Manager - Confirm your account",
      text: "Confirm your account please",
      html: `
      <p>Hello: ${user.name}, you have been created an account on Task Manager, confirm your account via next link please</p>
      <a href=''>Confirm account</a>
      <p>And put the code: <b>${user.token}</b></p>
      <p>This token expires in 10 minuts</p>
      `,
    });
    console.log("Message sended", info.messageId);
  };
}
