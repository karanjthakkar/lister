var mongoose = require('mongoose'),
  _ = require('lodash'),
  async = require('async'),
  Twit = require('twit'),
  BigNumber = require('bignumber.js'),
  utils = require('../utils'),
  User = mongoose.model('User'),
  argv = require('minimist')(process.argv.slice(2)),
  config = require('../config');

//Setup config based on environment
config = config[argv['environment'] || 'local'];

exports.saveOrUpdateUserData = function(userData, done) {
  console.log(Date.now() + ' saveOrUpdateUserData: ' + userData.id);
  var user;
  //Update or add new user to collection
  User.findOne({
    id: userData.id
  }, function(err, user) {
    if (err) {
      return done(err); //If some error, return it
    } else {
      if (!user) { //Check if user is present in db. If not, create a new user
        console.log(Date.now() + ' New User Created: ' + userData.id_str);
        var now = Date.now();
        userData = _.extend(userData, {
          created_at: now,
          last_access_date: now
        });
        user = new User(userData);
      } else { //Else update existing user
        console.log(Date.now() + ' Existing User Login: ' + userData.id_str);
        _.forOwn(userData, function(value, key) {
          user[key] = userData[key];
        });
        user.last_access_date = Date.now();
      }
      user.save(function(err, user) {
        done(err, {
          id: user.id,
          username: user.username
        });
      });
    }
  });

};

exports.getUserData = function(req, res) {
  var userId = parseInt(req.params.id);
  if(req.user && req.user.id !== userId) {
    return res.status(403).json({
      message: 'You are not authorized to view this'
    });
  }
  if (req.isAuthenticated()) {
    var userId = req.user.id;

    //Update or add new user to collection
    User.findOne({
      id: userId
    }, function(err, user) {
      if (err) {
        res.status(500).json({
          message: 'There was an error finding your records'
        });
      } else {
        var userObject = {
          id: user.id,
          description: user.description,
          name: user.name,
          username: user.username,
          followers: user.followers,
          following: user.following,
          lists: user.lists,
          profile_image_url: user.profile_image_url,
          profile_banner_url: user.profile_banner_url,
          created_at: user.created_at,
          lists_added: user.lists_added
        };
        return res.status(200).json(userObject);
      }
    });
  } else {
    respondToUnauthenticatedRequests(res);
  }
};

exports.getUserLists = function(req, res) {
  var userId = parseInt(req.params.id);
  console.log(Date.now() + ' getUserLists called by ' + userId + ' for ' + (req.user && JSON.stringify(req.user)));
  if(req.user && req.user.id !== userId) {
    return res.status(403).json({
      message: 'You are not authorized to view this'
    });
  }
  if (req.isAuthenticated()) {
    User.findOne({
      id: userId
    }, function(err, user) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'User not found'
        });
      }

      var T = new Twit({
        consumer_key: config.TWITTER_CONSUMER_KEY,
        consumer_secret: config.TWITTER_CONSUMER_SECRET,
        access_token: user.twitter_token,
        access_token_secret: user.twitter_token_secret
      });

      utils.getUserLists(T, function(err, user_lists) {

        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error fetching user lists from twitter'
          });
        }

        returnObj = _.map(user_lists, function(item) {
          return {
            list_id: item.id_str,
            is_private: item.mode !== 'public',
            list_member_count: item.member_count,
            list_subscriber_count: item.subscriber_count,
            list_description: item.description,
            list_name: item.name,
            list_created_at: item.created_at,
            is_owner: item.user.id === userId,
            list_owner_author: item.user.screen_name,
            list_owner_profile_image_url: item.user.profile_image_url_https
          };
        });
        return res.status(200).json({
          success: true,
          data: returnObj
        });
      });
    });
  } else {
    respondToUnauthenticatedRequests(res);
  }
};

exports.addListItem = function(req, res) {
  var userId = parseInt(req.params.id);
  if(req.user && req.user.id !== userId) {
    return res.status(403).json({
      message: 'You are not authorized to view this'
    });
  }
  if (req.isAuthenticated()) {
    User.findOne({
      id: userId
    }, function(err, user) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'User not found'
        });
      }
      var T = new Twit({
        consumer_key: config.TWITTER_CONSUMER_KEY,
        consumer_secret: config.TWITTER_CONSUMER_SECRET,
        access_token: user.twitter_token,
        access_token_secret: user.twitter_token_secret
      });
      utils.getSingleList(T, req.params.list_id, function(err, list) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error fetching list details'
          });
        }
        var isAlreadyAdded = _.some(user.lists_added, function(item) {
          return item.list_id === req.params.list_id
        });
        if (isAlreadyAdded) {
          return res.status(200).json({
            success: true
          });
        }
        var listObject = {
          list_id: list.id_str,
          list_mode: list.mode,
          list_member_count: list.member_count,
          list_subscriber_count: list.subscriber_count,
          list_description: list.description,
          list_name: list.name,
          list_created_at: list.created_at
        };
        user.lists_added.push(listObject);
        user.save(function(err, data) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Error saving to DB'
            });
          }
          return res.status(200).json({
            success: true
          });
        });
      });
    })
  } else {
    respondToUnauthenticatedRequests(res);
  }
};

exports.removeListItem = function(req, res) {
  var userId = parseInt(req.params.id);
  if(req.user && req.user.id !== userId) {
    return res.status(403).json({
      message: 'You are not authorized to view this'
    });
  }
  if (req.isAuthenticated()) {
    User.findOne({
      id: userId
    }, function(err, user) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'User not found'
        });
      }
      var T = new Twit({
        consumer_key: config.TWITTER_CONSUMER_KEY,
        consumer_secret: config.TWITTER_CONSUMER_SECRET,
        access_token: user.twitter_token,
        access_token_secret: user.twitter_token_secret
      });
      user.lists_added = _.filter(user.lists_added, function(item) {
        return item.list_id !== req.params.list_id
      });
      user.save(function(err, data) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error saving to DB'
          });
        }
        return res.status(200).json({
          success: true
        });
      });
    })
  } else {
    respondToUnauthenticatedRequests(res);
  }
};

exports.doTweetAction = function(req, res) {
  var userId = parseInt(req.params.id);
  var action = req.params.action;
  var tweetId = req.params.tweet_id;
  console.log(Date.now() + ' doTweetAction called by ' + userId + ' for ' + (req.user && JSON.stringify(req.user)) + ' with action ' + action + ' for tweetId ' + tweetId);
  if(req.user && req.user.id !== userId) {
    return res.status(403).json({
      message: 'You are not authorized to view this'
    });
  }
  if (req.isAuthenticated()) {
    User.findOne({
      id: userId
    }, function(err, user) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'User not found'
        });
      }

      if (['favorite', 'retweet', 'discard'].indexOf(action) === -1) {
        return res.status(500).json({
          success: false,
          message: 'Provide a valid action'
        });
      }

      // Check if is already taken action on
      var isAlreadyAdded = _.some(user.tweets_seen, function(tweet) {
        return (tweet.tweet_id === tweetId && tweet.tweet_action === action);
      });
      if (isAlreadyAdded) {
        return res.status(200).json({
          success: true
        });
      }

      // If discard, store it in our db and reply success
      if (action === 'discard') {
        var tweetObject = {
          tweet_action: 'discard',
          tweet_id: tweetId
        };
        user.tweets_seen.push(tweetObject);
        user.save(function(err, data) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Error performing discard'
            });
          }
          return res.status(200).json({
            success: true
          });
        });
      } else {
        var T = new Twit({
          consumer_key: config.TWITTER_CONSUMER_KEY,
          consumer_secret: config.TWITTER_CONSUMER_SECRET,
          access_token: user.twitter_token,
          access_token_secret: user.twitter_token_secret
        });
        utils[action](T, tweetId, function(err, list) {
          if (err) {
            if (
                err.code === 139 // Already fav
                || err.code === 327 // Already RT
              ) {
                return res.status(200).json({
                  success: true
                });
            } else {
              return res.status(500).json({
                success: false,
                message: 'Error performing ' + action
              });
            }
          }
          var tweetObject = {
            tweet_action: action,
            tweet_id: tweetId
          };
          user.tweets_seen.push(tweetObject);
          user.save(function(err, data) {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Error saving to DB'
              });
            }
            return res.status(200).json({
              success: true
            });
          });
        });
      }

    })
  } else {
    respondToUnauthenticatedRequests(res);
  }
};

exports.getListStatuses = function(req, res) {
  var userId = parseInt(req.params.id);
  var listId = req.params.list_id;
  var maxId = req.query.max_id;
  console.log(Date.now() + ' getListStatuses called by ' + userId + ' for ' + (req.user && JSON.stringify(req.user)) + ' for list ' + listId + ' with maxId ' + maxId);
  if(req.user && req.user.id !== userId) {
    console.log(err, userId, listId, maxId);
    return res.status(403).json({
      message: 'You are not authorized to view this'
    });
  }
  if (req.isAuthenticated()) {
    User.findOne({
      id: userId
    }, function(err, user) {
      if (err) {
        console.log(err, userId, listId, maxId);
        return res.status(500).json({
          success: false,
          message: 'User not found'
        });
      }

      var T = new Twit({
        consumer_key: config.TWITTER_CONSUMER_KEY,
        consumer_secret: config.TWITTER_CONSUMER_SECRET,
        access_token: user.twitter_token,
        access_token_secret: user.twitter_token_secret
      });

      utils.getListTimeline(T, listId, maxId, function(err, listStatuses) {

        if (err) {
          console.log(err, userId, listId, maxId);
          return res.status(500).json({
            success: false,
            message: 'Error fetching user list statuses'
          });
        }

        var nextMaxId = null,
          responseJson = {
            success: true,
            data: utils.filterAndBuildTweetsForClient(listStatuses, user.tweets_seen),
          };

        if (listStatuses.length > 0) {
          nextMaxId = new BigNumber(listStatuses[listStatuses.length - 1].id_str)
          responseJson.next_max_id = nextMaxId.minus(1);
        }

        return res.status(200).json(responseJson);
      });
    });
  } else {
    respondToUnauthenticatedRequests(res);
  }
};


function respondToUnauthenticatedRequests(res) {
  res.status(403).json({
    success: false,
    message: 'You are not logged in. Please login to continue'
  });
}
