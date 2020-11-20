const { authenticate } = require("./authenticate");
const { authorize } = require("./authorize");
const { changePassword } = require("./change_password");
const { confirmPassword } = require("./confirm_password");
const { confirmRegistration } = require("./confirm_registration");
const { forgotPassword } = require("./forgot_password");
const { resendConfirmationCode } = require("./resend_confirmation_code");
const { signUp } = require("./signup");
const { refreshToken } = require("./refresh_token");

module.exports = {
  authenticate,
  authorize,
  changePassword,
  confirmPassword,
  confirmRegistration,
  forgotPassword,
  resendConfirmationCode,
  signUp,
  refreshToken,
};
