import type { Request, Response, NextFunction } from "express";
import Task, { ITask } from "../models/Task";

declare global {
  namespace Express {
    interface Request {
      task: ITask;
    }
  }
}

export async function taskExists(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      const error = new Error("Task not found");
      res.status(404).json({ error: error.message });
    }
    req.task = task;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function taskBelongsToProject(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.task.project.toString() !== req.project.id.toString()) {
      const error = new Error("Task ID or Project ID are invalid");
      res.status(400).json({ error: error.message });
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function hasAuthorization(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.user.id.toString() !== req.project.manager.toString()) {
      const error = new Error("No valid action");
      res.status(400).json({ error: error.message });
      return;
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
