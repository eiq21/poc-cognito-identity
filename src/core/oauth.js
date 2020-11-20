require("cross-fetch/polyfill");

const env = require("dotenv").config();
const axios = require("axios").default;
const {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
  CognitoAccessToken,
  CognitoIdToken,
  CognitoRefreshToken,
} = require("amazon-cognito-identity-js");

const AWS = require("aws-sdk");

const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const log = require("fancy-log");

const { TokenExpiredError } = require("./oauth.errors");
const { resolve } = require("aws-sdk/lib/model/shape");

const { COGNITO_POOL_ID, APP_CLIENT_ID } = env.parsed;
const cognitoIssuer = `https://apiconnect-ibm-poc.auth.us-east-1.amazoncognito.com/${COGNITO_POOL_ID}`; // `https://cognito-idp.us-east-1.amazonaws.com/${COGNITO_POOL_ID}`;
let cacheKeys = null;

const getPublicKeys = async () => {
  if (cacheKeys) return cacheKeys;

  const url = `${cognitoIssuer}/.well-known/jwks.json`;
  const response = await axios.get(url);

  cacheKeys = response.data.keys.reduce((agg, current) => {
    const pem = jwkToPem(current);
    agg[current.kid] = { instance: current, pem };
    return agg;
  });

  return cacheKeys;
};

class OAuth {
  constructor() {
    AWS.config.update({ region: "us-east-1" });
    this.oauth = new CognitoUserPool({
      UserPoolId: COGNITO_POOL_ID,
      ClientId: APP_CLIENT_ID,
    });
    this.client = new AWS.SecretsManager();
  }

  user(username) {
    return new CognitoUser({ Username: username, Pool: this.oauth });
  }

  session(accessToken, idToken, refreshToken) {
    return new CognitoUserSession({
      AccessToken: new CognitoAccessToken({ AccessToken: accessToken }),
      IdToken: new CognitoIdToken({ IdToken: idToken }),
      RefreshToken: new CognitoRefreshToken({ RefreshToken: refreshToken }),
    });
  }

  async userWithSession(accessToken, idToken) {
    const { username } = await this._validateToken(accessToken);
    const user = this.user(username);

    user.setSignInUserSession(this.session(accessToken, idToken, ""));

    return user;
  }

  getUsers(familyName) {
    return new Promise((resolve, reject) => {
      const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
      var params = {
        UserPoolId: COGNITO_POOL_ID,
        Filter: `family_name = "${familyName}"`,
        AttributesToGet: ["custom:hash"],
        Limit: 10,
      };

      cognitoidentityserviceprovider.listUsers(params, function (err, data) {
        if (err) {
          console.log(err, err.stack);
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async getSecretByKey(key) {
    const params = {
      Filters: [
        {
          Key: "name",
          Values: [key],
        },
      ],
    };
    return await new Promise((resolve, reject) => {
      this.client.listSecrets(params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  async getSecretValue(secretId) {
    const params = {
      SecretId: secretId,
    };
    return await new Promise((resolve, reject) => {
      this.client.getSecretValue(params, (err, result) => {
        if (err) reject(err);
        else resolve(result.SecretString);
      });
    });
  }

  async getSecretValueV2(secretId) {
    const params = {
      SecretId: secretId,
    };
    return await new Promise((resolve, reject) => {
      this.client.getSecretValue(params, (err, result) => {
        if (err) reject(err);
        else resolve(JSON.parse(result.SecretString));
      });
    });
  }

  async signUp({ email, password, phoneNumber }) {
    const attributes = [this._createAttribute("phone_number", phoneNumber)];

    return new Promise((resolve, reject) => {
      this.oauth.signUp(email, password, attributes, null, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(result.user);
      });
    });
  }
  async confirmRegistration(username, code) {
    const user = this.user(username);

    return new Promise((resolve, reject) => {
      user.confirmRegistration(code, true, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(result);
      });
    });
  }

  async resendConfirmationCode(username) {
    const user = this.user(username);

    return new Promise((resolve, reject) => {
      user.resendConfirmationCode((err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(result);
      });
    });
  }

  async authenticate(username, password) {
    const user = this.user(username);
    const details = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    return new Promise((resolve, reject) => {
      user.authenticateUser(details, {
        onSuccess: (session) => {
          resolve(this._getTokens(session));
        },
        onFailure: (err) => {
          reject(err);
        },
        newPasswordRequired: () => {
          log.info("Updating new password!!!");
          this._completeNewPasswordChallenge(username, password)
            .then(resolve)
            .catch(reject);
        },
      });
    });
  }

  async authorize(accessToken) {
    const { username } = await this._validateToken(accessToken);
    return !!username;
  }

  async changePassword({ accessToken, idToken, oldPassword, newPassword }) {
    const user = await this.userWithSession(accessToken, idToken);

    return new Promise((resolve, reject) => {
      user.changePassword(oldPassword, newPassword, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(result);
      });
    });
  }

  async forgotPassword(username) {
    const user = this.user(username);

    return new Promise((resolve, reject) => {
      user.forgotPassword({
        onSuccess: (data) => {
          resolve(data);
        },
        onFailure: reject,
      });
    });
  }

  async confirmPassword(username, code, newPassword) {
    const user = this.user(username);

    return new Promise((resolve, reject) => {
      user.confirmPassword(code, newPassword, {
        onSuccess: resolve,
        onFailure: reject,
      });
    });
  }

  async refreshToken(accessToken, idToken, refreshToken) {
    const session = this.session(accessToken, idToken, refreshToken);

    if (session.isValid()) {
      return { message: "Cannot update the token until it expires" };
    }

    const { username } = await this._decodeToken(accessToken);
    const user = this.user(username);

    return new Promise((resolve, reject) => {
      user.refreshSession(session.getRefreshToken(), (err, _session) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(this._getTokens(_session));
      });
    });
  }

  async getUserAttributes(username) {
    const user = this.user(username);
    return new Promise((resolve, reject) => {
      user.getUserAttributes((err, result), {
        onSuccess: resolve(result),
        onFailure: reject(err),
      });
    });
    // user.getUserAttributes((err, result) => {
    //   if (err) console.error(err);
    //   else return result;
    // });
  }

  _completeNewPasswordChallenge(username, password) {
    const user = this.user(username);

    return new Promise((resolve, reject) => {
      user.completeNewPasswordChallenge(
        password,
        {},
        {
          onSuccess: (session) => {
            resolve(this._getTokens(session));
          },
          onFailure: reject,
        }
      );
    });
  }

  _createAttribute(name, value) {
    return new CognitoUserAttribute({ Name: name, Value: value });
  }

  _getTokens(session) {
    return {
      accessToken: session.getAccessToken().getJwtToken(),
      idToken: session.getIdToken().getJwtToken(),
      refreshToken: session.getRefreshToken().getToken(),
    };
  }

  async _decodeToken(token) {
    const tokenSections = (token || "").split(".");

    if (tokenSections.length < 2) {
      throw new Error("Token is invalid");
    }

    const headerJSON = Buffer.from(tokenSections[0], "base64").toString("utf8");
    const header = JSON.parse(headerJSON);

    const keys = await getPublicKeys();
    const key = keys[header.kid];

    if (typeof key === "undefined") {
      throw new Error("Claim made for unknown kid");
    }

    return jwt.verify(token, key.pem);
  }

  async _validateToken(token) {
    const claim = await this._decodeToken(token);
    const currentSeconds = Math.floor(new Date().valueOf() / 1000);

    if (currentSeconds > claim.exp || currentSeconds < claim.auth_time) {
      throw new TokenExpiredError(401, "Claim is Expired or Invalid");
    }

    if (claim.iss !== cognitoIssuer) {
      throw new Error("claim issuer is invalid");
    }

    if (claim.token_use !== "access") {
      throw new Error("claim use is not access");
    }

    log.info(`claim confirmed for ${claim.username}`);
    return {
      username: claim.username,
      clientId: claim.client_id,
    };
  }

  getClamsFromIdToken(idtoken) {
    const idTokenSecctions = (idtoken || "").split(".");
    const payload = Buffer.from(idTokenSecctions[1], "base64").toString("utf8");
    const payloadJson = JSON.parse(payload);
    return {
      dependents_hash: payloadJson["custom:dependents_hash"],
      hash: payloadJson["custom:hash"],
      dependents_username: payloadJson["custom:dependents_username"],
    };
  }
}

module.exports = { OAuth };
