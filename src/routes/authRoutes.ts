import { Router } from "express";
import { body, param } from "express-validator";
import { AuthController } from "../controllers/AuthController";
import { handleInputErrors } from "../middleware/validation";

const router = Router();

router.post(
  "/create-account",
  body("name").notEmpty().withMessage("Name is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password is required, minimun 8 characters"),
  body("password_confirmation").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Password and confirmation password must be the same");
    }
    return true;
  }),
  body("email").isEmail().withMessage("Email no valid"),
  handleInputErrors,
  AuthController.createAccount
);

router.post(
  "/confirm-account",
  body("token").notEmpty().withMessage("Token must not be empty"),
  handleInputErrors,
  AuthController.confirmAccount
);

router.post(
  "/login",
  body("email").isEmail().withMessage("Email no valid"),
  body("password").notEmpty().withMessage("Password is required"),
  handleInputErrors,
  AuthController.login
);

router.post(
  "/request-confirmation-token",
  param("token").isNumeric().withMessage("Token not valid"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password is required, minimun 8 characters"),
  body("password_confirmation").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Password and confirmation password must be the same");
    }
    return true;
  }),
  handleInputErrors,
  AuthController.requestConfirmationToken
);

router.post(
  "/forgot-password",
  body("email").isEmail().withMessage("Email no valid"),
  handleInputErrors,
  AuthController.forgotPassword
);

router.post(
  "/validate-token",
  body("token").notEmpty().withMessage("Token must not be empty"),
  handleInputErrors,
  AuthController.validateToken
);
router.post(
  "/update-password/:token",
  param("token").notEmpty().withMessage("Token must not be empty"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password is required, minimun 8 characters"),
  body("password_confirmation").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Password and confirmation password must be the same");
    }
    return true;
  }),
  handleInputErrors,
  AuthController.updatePasswordWithToken
);

export default router;
