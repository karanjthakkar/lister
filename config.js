var config = {
  local: {
    callbackURL: '//local.lister.co:3000/auth/twitter/callback',
    dbUrl: 'mongodb://127.0.0.1:27017/lister-local',
    TWITTER_CONSUMER_KEY: process.env.lister_consumer_key,
    TWITTER_CONSUMER_SECRET: process.env.lister_consumer_secret,
    TWITTER_ACCESS_TOKEN: process.env.lister_access_token,
    TWITTER_ACCESS_TOKEN_SECRET: process.env.lister_access_token_secret,
    frontendUrl: 'http://local.lister.co:3000'
  },
  staging: {
    callbackURL: '//api.lister.co/auth/twitter/callback',
    dbUrl: 'mongodb://127.0.0.1:27017/lister-staging',
    TWITTER_CONSUMER_KEY: process.env.lister_consumer_key,
    TWITTER_CONSUMER_SECRET: process.env.lister_consumer_secret,
    TWITTER_ACCESS_TOKEN: process.env.lister_access_token,
    TWITTER_ACCESS_TOKEN_SECRET: process.env.lister_access_token_secret,
    frontendUrl: 'http://staging.lister.co'
  },
  prod: {
    callbackURL: '//api.lister.co/auth/twitter/callback',
    dbUrl: 'mongodb://127.0.0.1:27017/lister',
    TWITTER_CONSUMER_KEY: process.env.lister_consumer_key,
    TWITTER_CONSUMER_SECRET: process.env.lister_consumer_secret,
    TWITTER_ACCESS_TOKEN: process.env.lister_access_token,
    TWITTER_ACCESS_TOKEN_SECRET: process.env.lister_access_token_secret,
    frontendUrl: 'http://lister.co'
  }
};

module.exports = config;
