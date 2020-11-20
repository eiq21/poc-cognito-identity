const { oauth } = require("../core");

const resendConfirmationCode = async (ctx) => {
  const { username } = ctx.request.body;
  ctx.body = await oauth.resendConfirmationCode(username);
};

module.exports = { resendConfirmationCode };
