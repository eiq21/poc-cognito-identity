const Router = require("@koa/router");
const log = require("fancy-log");
const {
  signUp,
  confirmRegistration,
  resendConfirmationCode,
  authenticate,
  authorize,
  changePassword,
  forgotPassword,
  confirmPassword,
  refreshToken,
} = require("./controllers");

const router = new Router({ prefix: "/oauth" });
router.post("/signup", signUp);
router.post("/authenticate", authenticate);
router.post("/authorize", authorize);
router.post("/refresh_token", refreshToken);
router.post("/resend_confirmation_code", resendConfirmationCode);
router.post("/confirm_registration", confirmRegistration);
router.post("/change_password", changePassword);
router.post("/forgot_password", forgotPassword);
router.post("/confirm_password", confirmPassword);

module.exports = { router };
