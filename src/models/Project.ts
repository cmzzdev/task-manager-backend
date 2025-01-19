import mongoose, { Schema, Document, PopulatedDoc, Types } from "mongoose";
import Task, { ITask } from "./Task";
import { IUser } from "./Auth";
import Note from "./Note";

export interface IProject extends Document {
  projectName: string;
  clientName: string;
  description: string;
  tasks: PopulatedDoc<ITask & Document>[];
  manager: PopulatedDoc<IUser & Document>;
  team: PopulatedDoc<IUser & Document>[];
}

const ProjectSchema: Schema = new Schema(
  {
    projectName: {
      type: String,
      require: true,
      trim: true,
    },
    clientName: {
      type: String,
      require: true,
      trim: true,
    },
    description: {
      type: String,
      require: true,
      trim: true,
    },
    tasks: [
      {
        type: Types.ObjectId,
        ref: "Task",
      },
    ],
    manager: {
      type: Types.ObjectId,
      ref: "User",
    },
    team: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

//  Middleware to delete all tasks from this project when project is removed
ProjectSchema.pre("deleteOne", { document: true }, async function () {
  const projectId = this._id;
  if (!projectId) return;
  // all tasks from this project
  const tasks = await Task.find({ project: projectId });
  for (const task of tasks) {
    // delete notes from this project
    await Note.deleteMany({ task: task.id });
  }
  await Task.deleteMany({ project: projectId });
});
// end

const Project = mongoose.model<IProject>("Project", ProjectSchema);
export default Project;
