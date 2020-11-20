const { OracleConnect } = require("../core/oracle.db");

class UserRepository {
  getUserByEmail = async (email) => {
    const sql =
      "select USU_LOGIN,USU_PWD from usu_usuario where usu_login =:email";
    const params = { email: email };
    const oracleConnect = new OracleConnect();
    const response = await oracleConnect.executeSql(sql, params);
    await oracleConnect.destroyPool();
    if (!response) throw new Error("Error oracle provider");
    let result = [];
    if (response.rows.length === 0) return [];
    result = response.rows.map((row) => {
      return { user: row.USU_LOGIN, password: row.USU_PWD };
    });
    return result[0] || [];
  };

  getUserByCode = async (code) => {
    const sql = "select USU_LOGIN,USU_PWD from usu_usuario where USU_PK =:code";
    const params = { code: code };
    const oracleConnect = new OracleConnect();
    const response = await oracleConnect.executeSql(sql, params);
    await oracleConnect.destroyPool();
    if (!response) throw new Error("Error oracle provider");
    let result = [];
    if (response.rows.length === 0) return [];
    result = response.rows.map((row) => {
      return { user: row.USU_LOGIN, password: row.USU_PWD };
    });
    return result[0] || [];
  };
}

module.exports = { UserRepository };
