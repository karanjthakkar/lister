var fs = require('fs'),
  path = require('path'),
  cookieParser = require('cookie-parser'),
  express = require('express'),
  bodyParser = require('body-parser'),
  passport = require('passport'),
  TwitterStrategy = require('passport-twitter').Strategy,
  session = require('express-session'),
  argv = require('minimist')(process.argv.slice(2)),
  config = require('./config'),
  mongoose = require('mongoose'),
  MongoStore = require('connect-mongo')(session),
  app = express();

//Setup config based on environment
config = config[argv['environment'] || 'local'];

//initiate DB connection using mongoose
mongoose.connect(config.dbUrl);

// Bootstrap models
var modelsPath = path.join(__dirname, 'models');
fs.readdirSync(modelsPath).forEach(function (file) {
  require(modelsPath + '/' + file);
});

var UserController = require('./controllers/user');
var User = mongoose.model('User');

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session.  Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.  However, since this example does not
// have a database of user records, the complete Twitter profile is serialized
// and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  User.findOne({
    id: obj.id
  }, function(err, user) {
    if (user) {
      var userObj = {
        id: user.id,
        username: user.username
      };
      done(null, userObj);
    } else {
      done(null, {});
    }
  })
});

// Use the TwitterStrategy within Passport.
// Strategies in passport require a `verify` function, which accept
// credentials (in this case, a token, tokenSecret, and Twitter profile), and
// invoke a callback with a user object.
passport.use(new TwitterStrategy({
    consumerKey: config.TWITTER_CONSUMER_KEY,
    consumerSecret: config.TWITTER_CONSUMER_SECRET,
    callbackURL: config.callbackURL
  },
  function(token, tokenSecret, profile, done) {
    process.nextTick(function() {
      var user = {
        id: profile._json.id,
        description: profile._json.description,
        name: profile._json.name,
        username: profile._json.screen_name,
        followers: profile._json.followers_count,
        following: profile._json.friends_count,
        favorites: profile._json.favourites_count,
        statuses: profile._json.statuses_count,
        lists: profile._json.listed_count,
        location: profile._json.location,
        profile_image_url: profile._json.profile_image_url_https || profile._json.profile_image_url,
        profile_banner_url: profile._json.profile_banner_url,
        twitter_token: token,
        twitter_token_secret: tokenSecret,
        access_level: profile._accessLevel
      };
      UserController.saveOrUpdateUserData(user, done);
    });
  }
));

// configure Express
app.configure(function() {
  app.use(cookieParser());
  app.use(bodyParser.json());

  app.set('view engine', 'ejs'); // set up ejs for templating
  app.set('views', __dirname+'/views');

  app.use(express.session({
    secret: 'tweetify-geekykaran-a2da059017ef619e25f6347bf04a3b41',
    maxAge: new Date(Date.now() + 3600000),
    cookie: {
      path: '/',
      domain: '.tweetify.io'
    },
    store: new MongoStore({
      mongooseConnection: mongoose.connection
    })
  }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});

// Routing
require('./routes')(app, passport);

app.listen(3000);
