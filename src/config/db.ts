import mongoose from "mongoose";
import colors from "colors";

export const connectDB = async () => {
  try {
    const { connection } = await mongoose.connect(process.env.DATABASE_URL);
    const url = `${connection.host}:${connection.port}`;
    console.log(colors.magenta.bold(`MongoDB Connected on: ${url}`));
  } catch (error) {
    console.log(colors.red.bold("Error trying to connecet MongoDB"));
    process.exit(1);
  }
};
