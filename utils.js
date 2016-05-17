var _ = require('lodash');

module.exports = {

  favorite: function(T, id, callback) {
    T.post('favorites/create', {
      id: id,
      include_entities: false
    }, function(err, data) {
      callback(err, data);
    });
  },

  retweet: function(T, id, callback) {
    T.post('statuses/retweet', {
      id: id,
      include_entities: false
    }, function(err, data) {
      callback(err, data);
    });
  },

  getUserLists: function(T, callback) {
    T.get('lists/list', {
      reverse: true
    }, function(err, data) {
      callback(err, data);
    });
  },

  getSingleList: function(T, id, callback) {
    T.get('lists/show', {
      list_id: id
    }, function(err, data) {
      callback(err, data);
    });
  },

  getListTimeline: function(T, id, max, callback) {
    T.get('lists/statuses', {
      list_id: id,
      max_id: max,
      count: 50
    }, function(err, data) {
      callback(err, data);
    });
  },

  processTweet: function(text) {
    return text.replace(/\\n+/, ' ').replace('&amp;', '&');
  },

  filterAndBuildTweetsForClient: function(listStatuses, tweetsSeen) {
    return this.filterAlreadySeenTweets(listStatuses, tweetsSeen);
  },

  filterAlreadySeenTweets: function (listStatuses, tweetsSeen) {
    return listStatuses.filter(function(status) {
      var isPresent = _.find(tweetsSeen, function(tweet) {
        return status.id_str === tweet.tweet_id;
      });
      return !isPresent;
    });
  }

}
