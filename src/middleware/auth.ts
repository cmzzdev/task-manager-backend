import { Request, Response, NextFunction } from "express";
import { authMsg } from "../messages";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/Auth";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const bearer = req.headers.authorization;
  if (!bearer) {
    const error = new Error(authMsg.NOT_AUTHENTICATED);
    res.status(401).json({ error: error.message });
    return;
  }

  try {
    const [, token] = bearer.split(" ");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof decoded === "object" && decoded.id) {
      const user = await User.findById(decoded.id).select("_id name email");
      if (user) {
        req.user = user;
      } else {
        const error = new Error(authMsg.NOT_AUTHENTICATED);
        res.status(401).json({ error: error.message });
        return;
      }
    }
  } catch (error) {
    res.status(500).json({ error: authMsg.TOKEN_NOT_VALID });
    return;
  }
  next();
};
