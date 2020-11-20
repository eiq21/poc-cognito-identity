const { oauth } = require("../core");

const authorize = async (ctx) => {
  const { authorization } = ctx.request.headers;
  console.log(authorization);
  ctx.body = await oauth.authorize(authorization);
};

module.exports = { authorize };
