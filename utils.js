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

  unfavorite: function(T, id, callback) {
    T.post('favorites/destroy', {
      id: id,
      include_entities: false
    }, function(err, data) {
      callback(err, data);
    });
  },

  unretweet: function(T, id, callback) {
    T.post('statuses/unretweet', {
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
      count: 30
    }, function(err, data) {
      callback(err, data);
    });
  },

  processTweet: function(text) {
    return text.replace(/\\n+/, ' ').replace('&amp;', '&');
  },

  filterAndBuildTweetsForClient: function(listStatuses, tweetsSeen) {
    // listStatuses = this.filterAlreadySeenTweets(listStatuses, tweetsSeen);
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
        tweet_media_entities = [],
        quoted_tweet_media_entities = [],
        quoted_tweet_url_entities = [],
        in_reply_to_author = null,
        in_reply_to_author_name = null;

      if (tweet.is_quote_status) {
        quotedTweetObject = tweet.quoted_status || tweet.retweeted_status.quoted_status;
      }

      if (tweet.retweeted_status) {
        type = 'retweet',
        tweetForEntities = tweet.retweeted_status;
      }

      if (tweet.in_reply_to_screen_name) {
        const replyAuthorEntity = tweet.entities.user_mentions.filter((item) => {
          return item.screen_name === tweet.in_reply_to_screen_name;
        });
        if (replyAuthorEntity.length > 0) {
          in_reply_to_author = tweet.in_reply_to_screen_name;
          in_reply_to_author_name = replyAuthorEntity[0].name;
        } else if (tweet.user.screen_name === tweet.in_reply_to_screen_name) {

          in_reply_to_author = tweet.user.screen_name;
          in_reply_to_author_name = tweet.user.name;
        }
      }

      if (tweet.is_quote_status
          && (quotedTweetObject.entities && quotedTweetObject.entities.media)) {
        quoted_tweet_media_entities = quotedTweetObject.entities.media.map(function(entity) {
          return {
            url: entity.url,
            media_url: entity.media_url_https,
            display_url: entity.display_url,
            expanded_url: entity.expanded_url,
            indices: entity.indices,
            type: entity.type,
            aspectRatio: entity.sizes['large'].h / entity.sizes['large'].w
          };
        })
      }

      if (tweet.is_quote_status
          && (quotedTweetObject.entities && quotedTweetObject.entities.urls)) {
        quoted_tweet_url_entities = quotedTweetObject.entities.urls.map(function(entity) {
          return {
            url: entity.url,
            display_url: entity.display_url,
            expanded_url: entity.expanded_url,
            indices: entity.indices
          };
        })
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
            indices: entity.indices,
            type: entity.type,
            aspectRatio: entity.sizes['large'].h / entity.sizes['large'].w
          };
        })
      }

      return {
        tweet_id: tweet.id_str,
        tweet_author: tweet.user.screen_name,
        tweet_author_name: tweet.user.name,
        tweet_profile_image_url: tweet.user.profile_image_url_https,
        favorited: tweet.favorited,
        retweeted: tweet.retweeted,

        original_tweet_author: tweet.retweeted_status ? tweet.retweeted_status.user.screen_name : tweet.user.screen_name,
        original_tweet_author_name: tweet.retweeted_status ? tweet.retweeted_status.user.name : tweet.user.name,
        original_tweet_profile_image_url: tweet.retweeted_status ? tweet.retweeted_status.user.profile_image_url_https : tweet.user.profile_image_url_https,
        original_tweet_id: tweet.retweeted_status ? tweet.retweeted_status.id_str : tweet.id_str,

        in_reply_to_author,
        in_reply_to_author_name,
        
        tweet_text: getTweetText(tweet),
        tweet_url_entities: tweet_url_entities,
        tweet_media_entities: tweet_media_entities,
        tweet_type: type,
        retweet_count: tweet.retweeted_status ? tweet.retweeted_status.retweet_count : tweet.retweet_count,
        favorite_count: tweet.retweeted_status ? tweet.retweeted_status.favorite_count : tweet.favorite_count,
        tweet_posted_at: tweet.retweeted_status ? tweet.retweeted_status.created_at : tweet.created_at,

        is_quote_status: tweet.is_quote_status,
        quoted_status: tweet.is_quote_status ? {
          tweet_id: quotedTweetObject.id_str,
          tweet_author: quotedTweetObject.user.screen_name,
          tweet_author_name: quotedTweetObject.user.name,
          tweet_media_entities: quoted_tweet_media_entities,
          tweet_url_entities: quoted_tweet_url_entities,
          tweet_text: getTweetText(quotedTweetObject),
        } : null
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
  return text.replace(/\\n+/g, ' ').replace(/&amp;/g, '&')
}