import { type Request, type Response } from "express";
import Task, { taskStatus } from "../models/Task";
import { errorMsg, taskMsg } from "../messages";

export class TaskController {
  static createTask = async (req: Request, res: Response) => {
    try {
      const task = new Task(req.body);
      task.project = req.project.id;
      req.project.tasks.push(task.id);
      await Promise.allSettled([task.save(), req.project.save()]);
      res.json({ msg: taskMsg.TASK_CREATED });
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
      const task = await Task.findById(req.task.id).populate({
        path: "completedBy",
        select: "id name email",
      });
      res.json(task);
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
      res.json({ msg: taskMsg.TASK_UPDATED });
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
      res.json({ msg: taskMsg.TASK_DELETED });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };

  static updateStatus = async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      req.task.status = status;
      const data = {
        user: req.user.id,
        status,
      };
      req.task.completedBy.push(data);
      await req.task.save();
      res.json({ msg: taskMsg.TASK_UPDATED });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };
}
