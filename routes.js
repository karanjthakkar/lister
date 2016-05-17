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
      console.log(req.query);
      res.redirect(config.frontendUrl + '/?code=' + req.user.id);
    });

  app.post('/logout', function(req, res) {
    req.logout();
    res.status(200).json({
      success: true
    });
  });

  /**
  * Client Side API's
  */

  //Get user profile
  app.get('/users/:id', UserController.getUserData);

  //Get user list statuses form twitter
  app.get('/users/:id/list/:list_id/statuses', UserController.getListStatuses);

  //Get user lists from twitter
  app.get('/users/:id/lists', UserController.getUserLists);

  //Add list
  app.put('/users/:id/lists_added/:list_id', UserController.addListItem);

  //Remove list
  app.delete('/users/:id/lists_added/:list_id', UserController.removeListItem);

  //Fav/RT/Discard Tweet
  app.post('/users/:id/tweet_action/:action/:tweet_id', UserController.doTweetAction);

};
