const { OAuth } = require("./oauth");
const { OracleConnect } = require("./oracle.db");
const { errorHandler } = require("./error.handler");

const oauth = new OAuth();

module.exports = { oauth, errorHandler, OracleConnect };
