const { oauth } = require("../core");

const signUp = async (ctx) => {
  const { email, password, phoneNumber } = ctx.request.body;
  ctx.body = await oauth.signUp({
    email,
    password,
    phoneNumber,
  });
};

module.exports = { signUp };
