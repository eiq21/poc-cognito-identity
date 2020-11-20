const { oauth } = require("../core");

const confirmPassword = async (ctx) => {
  const { username, code, newPassword } = ctx.request.body;
  ctx.body = await oauth.confirmPassword(username, code, newPassword);
};

module.exports = { confirmPassword };
