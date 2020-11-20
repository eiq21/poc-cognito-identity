const { oauth } = require("../core");

const forgotPassword = async (ctx) => {
  const { username } = ctx.request.body;
  ctx.body = await oauth.forgotPassword(username);
};

module.exports = { forgotPassword };
