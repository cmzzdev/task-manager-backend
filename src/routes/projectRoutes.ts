import { Router } from "express";
import { body, param } from "express-validator";
import { ProjectController } from "../controllers/ProjectController";
import { handleInputErrors } from "../middleware/validation";
import { TaskController } from "../controllers/TaskController";
import { projectExists } from "../middleware/project";
import {
  hasAuthorization,
  taskBelongsToProject,
  taskExists,
} from "../middleware/task";
import { authenticate } from "../middleware/auth";
import { TeamMemberController } from "../controllers/TeamController";
import { NoteController } from "../controllers/NoteController";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  body("projectName").notEmpty().withMessage("Project name is required"),
  body("clientName").notEmpty().withMessage("Client name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  handleInputErrors,
  ProjectController.createProject
);
router.get("/", ProjectController.getAllProjects);
router.get(
  "/:id",
  param("id").isMongoId().withMessage("ID no valid"),
  handleInputErrors,
  ProjectController.getProjectById
);

router.put(
  "/:id",
  param("id").isMongoId().withMessage("ID no valid"),
  body("projectName").notEmpty().withMessage("Project name is required"),
  body("clientName").notEmpty().withMessage("Client name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  handleInputErrors,
  ProjectController.updateProject
);

router.delete(
  "/:id",
  param("id").isMongoId().withMessage("ID no valid"),
  handleInputErrors,
  ProjectController.deleteProject
);

/** Routes for tasks */
router.param("projectId", projectExists);

router.post(
  "/:projectId/tasks",
  hasAuthorization,
  body("name").notEmpty().withMessage("Task name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  handleInputErrors,
  TaskController.createTask
);

router.get("/:projectId/tasks", TaskController.getProjectTasks);

router.param("taskId", taskExists);
router.param("taskId", taskBelongsToProject);

router.get(
  "/:projectId/tasks/:taskId",
  param("taskId").isMongoId().withMessage("taskId no valid"),
  handleInputErrors,
  TaskController.getTaskById
);

router.put(
  "/:projectId/tasks/:taskId",
  hasAuthorization,
  param("taskId").isMongoId().withMessage("taskId no valid"),
  body("name").notEmpty().withMessage("Task name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  handleInputErrors,
  TaskController.updateTask
);

router.delete(
  "/:projectId/tasks/:taskId",
  hasAuthorization,
  param("taskId").isMongoId().withMessage("taskId no valid"),
  handleInputErrors,
  TaskController.deleteTask
);

router.post(
  "/:projectId/tasks/:taskId/status",
  param("taskId").isMongoId().withMessage("taskId no valid"),
  body("status").notEmpty().withMessage("Status is required"),
  handleInputErrors,
  TaskController.updateStatus
);

/** Routes for teams */
router.get("/:projectId/team", TeamMemberController.getTeamMembers);

router.post(
  "/:projectId/team/find",
  body("email").isEmail().toLowerCase().withMessage("Not valid email"),
  handleInputErrors,
  TeamMemberController.findMemberByEmail
);

router.post(
  "/:projectId/team",
  body("id").isMongoId().withMessage("ID no valid"),
  handleInputErrors,
  TeamMemberController.addMemberById
);

router.delete(
  "/:projectId/team/:userId",
  param("userId").isMongoId().withMessage("ID no valid"),
  handleInputErrors,
  TeamMemberController.removeMemberById
);

/** Routes for Notes */
router.post(
  "/:projectId/tasks/:taskId/notes",
  body("content").notEmpty().withMessage("Content note is required"),
  handleInputErrors,
  NoteController.createNote
);

router.get("/:projectId/tasks/:taskId/notes", NoteController.getTaskNotes);

router.delete(
  "/:projectId/tasks/:taskId/notes/:noteId",
  param("noteId").isMongoId().withMessage("Id no valid"),
  handleInputErrors,
  NoteController.deleteNote
);

export default router;
