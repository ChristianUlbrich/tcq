import User from './User.js';
export default interface GitHubAuthenticatedUser extends User {
  accessToken: string;
  refreshToken: string;
};
