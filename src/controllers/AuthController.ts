import { Request, Response } from "express";
import { errorMsg } from "../messages";
import User from "../models/Auth";
import { authMsg } from "../messages/authMessages";
import { hashPassword } from "../utils/utils";
import Token from "../models/Token";
import { generateToken } from "../utils/token";
import { AuthEmail } from "../emails/AuthEmail";

export class AuthController {
  static createAccount = async (req: Request, res: Response) => {
    try {
      const { password, email } = req.body;
      const user = new User(req.body);
      // Prevent duplicates
      const userExists = await User.findOne({ email });
      if (userExists) {
        const error = new Error(errorMsg.USER_ALREADY_REGIST);
        res.status(409).json({ error: error.message });
      }
      // Hash Password
      user.password = await hashPassword(password);

      // Generate token
      const token = new Token();
      token.token = generateToken();
      token.user = user.id;

      // Send email
      AuthEmail.sendConfirmationEmail({
        email: user.email,
        name: user.name,
        token: token.token,
      });

      await Promise.allSettled([user.save(), token.save()]);
      res.send({ msg: authMsg.ACCOUNT_CREATED });
    } catch (error) {
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };

  static confirmAccount = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const tokenExist = await Token.findOne({ token });
      if (!tokenExist) {
        const error = new Error(errorMsg.TOKEN_NOT_VALID);
        res.status(401).json({ error: error.message });
      }
      const user = await User.findById(tokenExist.user);
      user.confirmed = true;
      await Promise.allSettled([user.save(), tokenExist.deleteOne()]);
      res.send({ msg: authMsg.ACCOUNT_CONFIRMED });
    } catch (error) {
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };
}