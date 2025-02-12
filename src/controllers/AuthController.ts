import { Request, Response } from "express";
import { errorMsg } from "../messages";
import User from "../models/Auth";
import { authMsg } from "../messages";
import { checkPassword, hashPassword } from "../utils/utils";
import Token from "../models/Token";
import { generateToken } from "../utils/token";
import { AuthEmail } from "../emails/AuthEmail";
import { generateJWT } from "../utils/jwt";

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
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
      return;
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
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
      return;
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
      const token = generateJWT({ id: user.id });
      res.send(token);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
      return;
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
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
      return;
    }
  };

  static forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      // Check if user exist
      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error(errorMsg.USER_NOT_REGISTERED);
        res.status(404).json({ error: error.message });
        return;
      }

      // Generate token
      const token = new Token();
      token.token = generateToken();
      token.user = user.id;
      await token.save();

      // Send email
      AuthEmail.sendPasswordResetToken({
        email: user.email,
        name: user.name,
        token: token.token,
      });

      res.send({ msg: authMsg.RESEND_NEW_TOKEN });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
      return;
    }
  };

  static validateToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const tokenExist = await Token.findOne({ token });
      if (!tokenExist) {
        const error = new Error(errorMsg.TOKEN_NOT_VALID);
        res.status(404).json({ error: error.message });
        return;
      }
      res.send({ msg: authMsg.VALID_TOKEN_NEW_PASSWORD });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
      return;
    }
  };

  static updatePasswordWithToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const tokenExist = await Token.findOne({ token });
      if (!tokenExist) {
        const error = new Error(errorMsg.TOKEN_NOT_VALID);
        res.status(404).json({ error: error.message });
        return;
      }

      const user = await User.findById(tokenExist.user);
      user.password = await hashPassword(password);
      await Promise.allSettled([user.save(), tokenExist.deleteOne()]);
      res.send({ msg: authMsg.PASSWORD_CHANGED });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
      return;
    }
  };

  static user = async (req: Request, res: Response) => {
    res.json(req.user);
    return;
  };

  static updateProfile = async (req: Request, res: Response) => {
    const { name, email } = req.body;

    const userExist = await User.findOne({ email });

    if (userExist && userExist.id.toString() !== req.user.id.toString()) {
      const error = new Error(errorMsg.EMAIL_ALREADY_REGISTERED);
      res.status(409).json({ error: error.message });
      return;
    }

    req.user.name = name;
    req.user.email = email;

    try {
      await req.user.save();
      res.send({ msg: authMsg.PROFILE_UPDATED });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
      return;
    }
  };

  static updateCurrentUserPassword = async (req: Request, res: Response) => {
    const { current_password, password, password_confirmation } = req.body;
    const user = await User.findById(req.user.id);
    const isPasswordCorrect = await checkPassword(
      current_password,
      user.password
    );
    if (!isPasswordCorrect) {
      const error = new Error(errorMsg.CURRENT_PASSWORD_INCORRECT);
      res.status(401).json({ error: error.message });
      return;
    }
    try {
      user.password = await hashPassword(password);
      await user.save();
      res.send({ msg: authMsg.PASSWORD_UPDATED });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
      return;
    }
  };

  static checkPassword = async (req: Request, res: Response) => {
    const { password } = req.body;
    const user = await User.findById(req.user.id);
    const isPasswordCorrect = await checkPassword(password, user.password);
    if (!isPasswordCorrect) {
      const error = new Error(errorMsg.INCORRECT_PASSWORD);
      res.status(401).json({ error: error.message });
      return;
    }
    res.send({ msg: authMsg.PASSWORD_CORRECT });
  };
}
