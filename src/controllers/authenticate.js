const { oauth } = require("../core");

const authenticate = async (ctx) => {
  const { username, password } = ctx.request.body;
  const response = await oauth.authenticate(username, password);

  if (!response) {
    ctx.body = { message: "Result is empty" };
    ctx.status = 400;
    return;
  }

  response.dependents = (await oauth.getUsers(username)) || {};

  ctx.body = response;
};

module.exports = { authenticate };
