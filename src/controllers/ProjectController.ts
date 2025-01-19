import type { Request, Response } from "express";
import Project from "../models/Project";
import { projectMsg, errorMsg } from "../messages";

export class ProjectController {
  static createProject = async (req: Request, res: Response) => {
    const project = new Project(req.body);
    try {
      // assign owner (manager)
      project.manager = req.user.id;
      await project.save();
      res.json({ msg: projectMsg.PROJECT_CREATED });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
      return;
    }
  };

  static getAllProjects = async (req: Request, res: Response) => {
    try {
      const projects = await Project.find({
        $or: [
          { manager: { $in: req.user.id } },
          { team: { $in: req.user.id } },
        ],
      });
      res.json(projects);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
      return;
    }
  };

  static getProjectById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const project = await Project.findById(id).populate("tasks");
      if (!project) {
        const error = new Error(errorMsg.PROJECT_NOT_FOUND);
        res.status(404).json({ error: error.message });
        return;
      }
      if (
        project.manager.toString() !== req.user.id.toString() &&
        !project.team.includes(req.user.id)
      ) {
        const error = new Error(errorMsg.NO_VALID_ACTION);
        res.status(404).json({ error: error.message });
        return;
      }
      res.json(project);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
      return;
    }
  };

  static updateProject = async (req: Request, res: Response) => {
    try {
      req.project.clientName = req.body.clientName;
      req.project.projectName = req.body.projectName;
      req.project.description = req.body.description;
      await req.project.save();
      res.send(req.project);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
      return;
    }
  };

  static deleteProject = async (req: Request, res: Response) => {
    try {
      await req.project.deleteOne();
      res.json({ msg: projectMsg.PROJECT_DELETED });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
      return;
    }
  };
}
