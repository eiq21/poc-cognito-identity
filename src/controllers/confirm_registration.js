const { oauth } = require("../core");

const confirmRegistration = async (ctx) => {
  const { username, code } = ctx.request.body;
  ctx.body = await oauth.confirmRegistration(username, code);
};

module.exports = { confirmRegistration };
