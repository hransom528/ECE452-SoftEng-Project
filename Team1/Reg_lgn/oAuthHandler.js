// const fetch = require('node-fetch');
const { google } = require('googleapis');
require('dotenv').config();


//configuring Oauth2 client with the google cloud project credential
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI // uri redirect for postman
);

// Function to get the access token from the authorization code
async function getAccessTokenFromCode(code) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens.access_token;
  } catch (error) {
    console.error("Error getting access token", error);
    throw new Error('Unable to get access token');
  }
}

// Function to get user information using the access token
async function getUserInfo(accessToken) {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });

    const userInfo = await oauth2.userinfo.get();
    return userInfo.data; // This contains the email and profile information
  } catch (error) {
    console.error("Error getting user info", error);
    throw new Error('Unable to get user information');
  }
}

module.exports = {
  getAccessTokenFromCode,
  getUserInfo
};
