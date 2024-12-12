import mongoose, { Schema, Document, Types } from "mongoose";

export interface IToken extends Document {
  token: string;
  user: Types.ObjectId;
  createdAt: Date;
}

const tokenSchemma: Schema = new Schema({
  token: {
    type: String,
    required: true,
  },
  user: {
    type: Types.ObjectId,
    required: true,
    ref: "User",
  },
  expiresAt: {
    type: Date,
    default: Date.now(),
    expires: "10m",
  },
});

const Token = mongoose.model<IToken>("Token", tokenSchemma);
export default Token;
