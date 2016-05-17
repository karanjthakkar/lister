var mongoose = require('mongoose'),
  _ = require('lodash'),
  async = require('async'),
  Twit = require('twit'),
  utils = require('../utils'),
  User = mongoose.model('User'),
  argv = require('minimist')(process.argv.slice(2)),
  config = require('../config');

//Setup config based on environment
config = config[argv['environment'] || 'local'];

exports.saveOrUpdateUserData = function(userData, done) {

  var user;

  //Update or add new user to collection
  User.findOne({
    id: userData.id
  }, function(err, user) {
    if (err) {
      return done(err); //If some error, return it
    } else {
      if (!user) { //Check if user is present in db. If not, create a new user
        var now = Date.now();
        userData = _.extend(userData, {
          created_at: now,
          last_access_date: now
        });
        user = new User(userData);
      } else { //Else update existing user
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

        var lists_added = _.map(user.lists_added, function(item) {
            return item.list_id;
          }),
          returnObj = [];

        returnObj = _.map(user_lists, function(item) {
          return {
            list_id: item.id_str,
            list_mode: item.mode,
            list_member_count: item.member_count,
            list_subscriber_count: item.subscriber_count,
            list_description: item.description,
            list_name: item.name,
            list_created_at: item.created_at,
            list_added: _.contains(lists_added, item.id_str),
            is_owner: item.user.id === userId
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

};


function respondToUnauthenticatedRequests(res) {
  res.status(403).json({
    success: false,
    message: 'You are not logged in. Please login to continue'
  });
}
