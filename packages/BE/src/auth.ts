// https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow
// https://github.com/octokit/auth-oauth-device.js
import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';

const auth = createOAuthDeviceAuth({
  clientType: "oauth-app",
  clientId: "1234567890abcdef1234",
  scopes: ["public_repo"],
  onVerification(verification) {
    // verification example
    // {
    //   device_code: "3584d83530557fdd1f46af8289938c8ef79f9dc5",
    //   user_code: "WDJB-MJHT",
    //   verification_uri: "https://github.com/login/device",
    //   expires_in: 900,
    //   interval: 5,
    // };

    console.log("Open %s", verification.verification_uri);
    console.log("Enter code: %s", verification.user_code);
  },
});

const tokenAuthentication = await auth({
  type: "oauth",
});
// resolves with
// {
//   type: "token",
//   tokenType: "oauth",
//   clientType: "oauth-app",
//   clientId: "1234567890abcdef1234",
//   token: "...", /* the created oauth token */
//   scopes: [] /* depend on request scopes by OAuth app */
// }
