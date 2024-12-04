import { Request, Response } from "express";
import { errorMsg } from "../messages";
import User from "../models/Auth";
import { authMsg } from "../messages/authMessages";
import { hashPassword } from "../utils/utils";

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
      await user.save();
      res.send({ msg: authMsg.ACCOUNT_CREATED });
    } catch (error) {
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };
}
