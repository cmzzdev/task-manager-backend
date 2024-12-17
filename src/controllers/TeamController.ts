import type { Request, Response } from "express";
import User from "../models/Auth";
import { teamMsg } from "../messages";
import Project from "../models/Project";

export class TeamMemberController {
  static findMemberByEmail = async (req: Request, res: Response) => {
    const { email } = req.body;
    // Find user
    const user = await User.findOne({ email }).select("id email name");
    if (!user) {
      const error = new Error(teamMsg.USER_NOT_FOUND);
      res.status(404).json({ error: error.message });
      return;
    }
    res.json(user);
  };

  static getTeamMembers = async (req: Request, res: Response) => {
    const project = await Project.findById(req.project.id).populate({
      path: "team",
      select: "id email name",
    });
    res.json(project.team);
  };

  static addMemberById = async (req: Request, res: Response) => {
    const { id } = req.body;
    const user = await User.findById(id).select("id");
    if (!user) {
      const error = new Error(teamMsg.USER_NOT_FOUND);
      res.status(404).json({ error: error.message });
      return;
    }

    if (
      req.project.team.some(
        (member) => member.toString() === user.id.toString()
      )
    ) {
      const error = new Error(teamMsg.USER_ALREADY_EXIST);
      res.status(409).json({ error: error.message });
      return;
    }

    req.project.team.push(user.id);
    await req.project.save();
    res.json({ msg: teamMsg.USER_ADDED });
  };

  static removeMemberById = async (req: Request, res: Response) => {
    const { id } = req.body;

    if (!req.project.team.some((member) => member.toString() === id)) {
      const error = new Error(teamMsg.USER_NOT_EXISTS);
      res.status(409).json({ error: error.message });
      return;
    }

    req.project.team = req.project.team.filter(
      (teamMember) => teamMember.toString() !== id
    );
    await req.project.save();
    res.json({ msg: teamMsg.USER_REMOVED });
  };
}
