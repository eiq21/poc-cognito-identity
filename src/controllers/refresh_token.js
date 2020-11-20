const { oauth } = require("../core");

const refreshToken = async (ctx) => {
  const { accessToken, idToken, refreshToken } = ctx.request.body;
  ctx.body = await oauth.refreshToken(accessToken, idToken, refreshToken);
};

module.exports = { refreshToken };
