import { Request, Response } from "express";
import { errorMsg } from "../messages";
import User from "../models/Auth";
import { authMsg } from "../messages/authMessages";
import { checkPassword, hashPassword } from "../utils/utils";
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
        return;
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
        res.status(404).json({ error: error.message });
        return;
      }
      const user = await User.findById(tokenExist.user);
      user.confirmed = true;
      await Promise.allSettled([user.save(), tokenExist.deleteOne()]);
      res.send({ msg: authMsg.ACCOUNT_CONFIRMED });
    } catch (error) {
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };

  static login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error(errorMsg.USER_NOT_FOUND);
        res.status(404).json({ error: error.message });
        return;
      }
      if (!user.confirmed) {
        const token = new Token();
        token.user = user.id;
        token.token = generateToken();
        await token.save();
        // Send email
        AuthEmail.sendConfirmationEmail({
          email: user.email,
          name: user.name,
          token: token.token,
        });
        const error = new Error(errorMsg.ACCOUNT_NOT_CONFIRMED);
        res.status(401).json({ error: error.message });
        return;
      }

      // Check password
      const isPasswordCorrect = await checkPassword(password, user.password);
      if (!isPasswordCorrect) {
        const error = new Error(errorMsg.INCORRECT_PASSWORD);
        res.status(401).json({ error: error.message });
        return;
      }

      res.send({ msg: authMsg.USER_AUTHENTICATED });
    } catch (error) {
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };

  static requestConfirmationToken = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      // Check if user exist
      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error(errorMsg.USER_NOT_REGISTERED);
        res.status(404).json({ error: error.message });
        return;
      }

      if (user.confirmed) {
        const error = new Error(errorMsg.USER_ALREADY_CONFIRMED);
        res.status(403).json({ error: error.message });
        return;
      }

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
      res.send({ msg: authMsg.RESEND_NEW_TOKEN });
    } catch (error) {
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };
}
