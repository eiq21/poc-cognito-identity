const { oauth } = require("../core");

const changePassword = async (ctx) => {
  const { authorization } = ctx.request.headers;
  const { oldPassword, newPassword } = ctx.request.body;
  ctx.body = await oauth.changePassword({
    accessToken: authorization,
    idToken: authorization,
    oldPassword,
    newPassword,
  });
};

module.exports = { changePassword };
