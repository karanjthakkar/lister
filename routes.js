var UserController = require('./controllers/user'),
  argv = require('minimist')(process.argv.slice(2)),
  config = require('./config');

//Setup config based on environment
config = config[argv['environment'] || 'local'];

/**
 * Application routes
 */
module.exports = function(app, passport) {

  // GET /auth/twitter
  // Use passport.authenticate() as route middleware to authenticate the
  // request.  The first step in Twitter authentication will involve redirecting
  // the user to twitter.com.  After authorization, the Twitter will redirect
  // the user back to this application at /auth/twitter/callback
  app.get('/auth/twitter', passport.authenticate('twitter', { forceLogin: true }));

  // GET /auth/twitter/callback
  // Use passport.authenticate() as route middleware to authenticate the
  // request.  If authentication fails, the user will be redirected back to the
  // login page.  Otherwise, the primary route function function will be called,
  // which, in this example, will redirect the user to the home page.
  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
      failureRedirect: config.frontendUrl + '/?code=0'
    }),
    function(req, res) {
      res.redirect(config.frontendUrl + '/?code=' + req.user.id);
    });

  /**
  * Client Side API's
  */

  // show the home page (will also have our login links)
  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  app.post('/logout', function(req, res) {
    req.logout();
    res.status(200).json({
      success: true
    });
  });

  //Get user profile
  app.get('/user/:id/profile', UserController.getUserData);

  //Get user list statuses form twitter
  app.get('/user/:id/list/:list_id/statuses', UserController.getListStatuses);

  //Get user lists from twitter
  app.get('/user/:id/lists', UserController.getUserLists);

  //Add list
  app.put('/user/:id/lists_added/:list_id', UserController.addListItem);

  //Remove list
  app.delete('/user/:id/lists_added/:list_id', UserController.removeListItem);

  //Fav/RT/Discard Tweet
  app.get('/user/:id/tweet_action/:action/:tweet_id', UserController.doTweetAction);

};



// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
