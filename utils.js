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
    listStatuses = this.filterAlreadySeenTweets(listStatuses, tweetsSeen);
    return this.buildTweetsForClient(listStatuses);
  },

  filterAlreadySeenTweets: function(listStatuses, tweetsSeen) {
    return listStatuses.filter(function(status) {

      if (status.favorited || status.retweeted) {
        return false;
      }

      var isPresent = _.find(tweetsSeen, function(tweet) {
        return status.id_str === tweet.tweet_id;
      });
      return !isPresent;
    });
  },

  buildTweetsForClient: function(listStatuses) {
    return listStatuses.map(function(tweet) {
      var type = 'original',
        tweetForEntities = tweet,
        tweet_url_entities = [],
        tweet_media_entities = [];

      if (tweet.retweeted_status) {
        type = 'retweet',
        tweetForEntities = tweet.retweeted_status;
      }

      if (tweetForEntities.entities && tweetForEntities.entities.urls) {
        tweet_url_entities = tweetForEntities.entities.urls.map(function(entity) {
          return {
            url: entity.url,
            display_url: entity.display_url,
            expanded_url: entity.expanded_url,
            indices: entity.indices
          };
        })
      }

      if (tweetForEntities.entities && tweetForEntities.entities.media) {
        tweet_media_entities = tweetForEntities.entities.media.map(function(entity) {
          return {
            url: entity.url,
            media_url: entity.media_url_https,
            display_url: entity.display_url,
            expanded_url: entity.expanded_url,
            indices: entity.indices
          };
        })
      }

      return {
        tweet_id: tweet.id_str,
        tweet_author: tweet.user.screen_name,
        tweet_profile_image_url: tweet.user.profile_image_url_https,
        
        original_tweet_author: tweet.retweeted_status ? tweet.retweeted_status.user.screen_name : tweet.user.screen_name,
        original_tweet_profile_image_url: tweet.retweeted_status ? tweet.retweeted_status.user.profile_image_url_https : tweet.user.profile_image_url_https,
        original_tweet_id: tweet.retweeted_status ? tweet.retweeted_status.id_str : tweet.id_str,
        
        tweet_text: getTweetText(tweet),
        tweet_url_entities: tweet_url_entities,
        tweet_media_entities: tweet_media_entities,
        tweet_type: type,
        retweet_count: tweet.retweeted_status ? tweet.retweeted_status.retweet_count : tweet.retweet_count,
        favorite_count: tweet.retweeted_status ? tweet.retweeted_status.favorite_count : tweet.favorite_count
      };
    });
  }
}

function getTweetText(tweet) {
  var actualTweet = tweet.retweeted_status || tweet,
    text = actualTweet.text;

  return processTweet(text);
}

function processTweet(text) {
  return text.replace(/\\n+/, ' ').replace('&amp;', '&');
}