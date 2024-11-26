import type { Request, Response } from "express";
import Project from "../models/Project";
import { projectMsg, errorMsg } from "../messages";

export class ProjectController {
  static createProject = async (req: Request, res: Response) => {
    const project = new Project(req.body);
    try {
      await project.save();
      res.json({ msg: projectMsg.PROJECT_CREATED });
    } catch (error) {
      console.log(error);
    }
  };

  static getAllProjects = async (req: Request, res: Response) => {
    try {
      const projects = await Project.find({});
      res.json(projects);
    } catch (error) {
      console.log(error);
    }
  };

  static getProjectById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const project = await Project.findById(id).populate("tasks");
      if (!project) {
        const error = new Error(errorMsg.PROJECT_NOT_FOUND);
        res.status(404).json({ error: error.message });
      }
      res.json(project);
    } catch (error) {
      console.log(error);
    }
  };

  static updateProject = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const project = await Project.findById(id);
      if (!project) {
        const error = new Error(errorMsg.PROJECT_NOT_FOUND);
        res.status(404).json({ error: error.message });
      }
      project.clientName = req.body.clientName;
      project.projectName = req.body.projectName;
      project.description = req.body.description;
      await project.save();
      res.send(project);
    } catch (error) {
      console.log(error);
    }
  };

  static deleteProject = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const project = await Project.findById(id);
      if (!project) {
        const error = new Error(errorMsg.PROJECT_NOT_FOUND);
        res.status(404).json({ error: error.message });
      }
      await project.deleteOne();
      res.json({ msg: projectMsg.PROJECT_DELETED });
    } catch (error) {
      console.log(error);
    }
  };
}
