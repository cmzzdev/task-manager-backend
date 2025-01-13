import type { Request, Response } from "express";
import Note, { INote } from "../models/Note";
import { errorMsg, noteMsg } from "../messages";
import { Types } from "mongoose";

type NoteParams = {
  noteId: Types.ObjectId;
};

export class NoteController {
  static createNote = async (req: Request<{}, {}, INote>, res: Response) => {
    const { content } = req.body;
    const note = new Note();
    note.content = content;
    note.createdBy = req.user.id;
    note.task = req.task.id;
    req.task.notes.push(note.id);
    try {
      await Promise.allSettled([req.task.save(), note.save()]);
      res.json({ msg: noteMsg.NOTE_CREATED });
    } catch (error) {
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };

  static getTaskNotes = async (req: Request, res: Response) => {
    try {
      const notes = await Note.find({ task: req.task.id });
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };

  static deleteNote = async (req: Request<NoteParams>, res: Response) => {
    const { noteId } = req.params;
    const note = await Note.findById(noteId);
    if (!note) {
      const error = new Error(errorMsg.NOTE_NOT_FOUND);
      res.status(404).json({ error: error.message });
      return;
    }

    if (note.createdBy.toString() !== req.user.id.toString()) {
      const error = new Error(errorMsg.NO_VALID_ACTION);
      res.status(401).json({ error: error.message });
      return;
    }

    req.task.notes = req.task.notes.filter(
      (note) => note.toString() !== noteId.toString()
    );

    try {
      await Promise.allSettled([req.task.save(), note.deleteOne()]);
      res.json({ msg: noteMsg.NOTE_DELETED });
    } catch (error) {
      res.status(500).json({ error: errorMsg.INTERNAL_SERVER_ERROR });
    }
  };
}
