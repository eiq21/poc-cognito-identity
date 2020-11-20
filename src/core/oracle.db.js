"use strict";
const oracledb = require("oracledb");
const env = require("dotenv").config();
const {
  ORACLE_DATABASE_USER,
  ORACLE_DATABASE_PASSWORD,
  ORACLE_DATABASE_CONNECTION_STRING,
} = env.parsed;
const cns = {
  user: ORACLE_DATABASE_USER,
  password: ORACLE_DATABASE_PASSWORD,
  connectString: ORACLE_DATABASE_CONNECTION_STRING,
};
class OracleConnect {
  createPool() {
    console.log(cns);
    if (this.pool) return Promise.resolve(this.pool);
    else return oracledb.createPool(cns);
  }

  destroyPool() {
    return !this.pool
      ? Promise.resolve()
      : this.pool.close().then(() => (this.pool = null));
  }

  executeSql(
    sql,
    bindParams = {},
    options = { outFormat: oracledb.OBJECT, autoCommit: true }
  ) {
    return this.createPool()
      .then((pool) => pool.getConnection())
      .then((connection) =>
        this.autoReleasingExecuteSql(connection, sql, bindParams, options)
      );
  }

  autoReleasingExecuteSql(connection, sql, params, options) {
    return new Promise((resolve, reject) => {
      connection
        .execute(sql, params, options)
        .then((results) => {
          return connection
            .release()
            .then(() => resolve(results))
            .catch((release_error) => resolve(results));
        })
        .catch((execute_error) => {
          return connection
            .release()
            .then(() => reject(execute_error))
            .catch((release_error) => reject(execute_error));
        });
    });
  }
}

module.exports = { OracleConnect };
