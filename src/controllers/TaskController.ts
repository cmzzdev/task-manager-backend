import { type Request, type Response } from "express";
import Task from "../models/Task";
import { errorMsg } from "../messages";

export class TaskController {
  static createTask = async (req: Request, res: Response) => {
    try {
      const task = new Task(req.body);
      task.project = req.project.id;
      req.project.tasks.push(task.id);
      await Promise.allSettled([task.save(), req.project.save()]);
      res.send("Task created");
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };

  static getProjectTasks = async (req: Request, res: Response) => {
    try {
      const tasks = await Task.find({ project: req.project.id }).populate(
        "project"
      );
      res.json(tasks);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };

  static getTaskById = async (req: Request, res: Response) => {
    try {
      res.json(req.task);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };

  static updateTask = async (req: Request, res: Response) => {
    try {
      req.task.name = req.body.name;
      req.task.description = req.body.description;
      await req.task.save();
      res.send("Task updated");
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };

  static deleteTask = async (req: Request, res: Response) => {
    try {
      req.project.tasks = req.project.tasks.filter(
        (task) => task.toString() !== req.task.id.toString()
      );
      await Promise.allSettled([req.task.deleteOne(), req.project.save()]);
      res.send("Task deleted");
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };

  static updateStatus = async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      req.task.status = status;
      await req.task.save();
      res.send("Status Updated");
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };
}
