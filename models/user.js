var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * User Schema
 */
var UserSchema = new Schema({
  id: Number,
  name: String,
  username: String,
  description: String,
  location: String,
  verified: Boolean,
  profile_image_url: String,
  profile_banner_url: String,
  followers: String,
  following: String,
  favorites: String,
  statuses: String,
  lists: String,
  application_token_expired: {
    type: Boolean,
    default: false
  },
  twitter_token: String,
  twitter_token_secret: String,
  access_level: String,
  last_access_date: Number,
  created_at: Number,
  lists_favorited: [{
    list_id: String,
    is_private: String,
    list_member_count: String,
    list_subscriber_count: String,
    list_description: String,
    list_name: String,
    list_created_at: {
      type: String,
      default: Date.now
    },
    is_owner: Boolean,
    list_owner_author: String,
    list_owner_profile_image_url: String
  }],
  tweets_seen: [{
    tweet_id: String,
    tweet_action: String //RT, FAV, DISCARD (Future: Reply, Quote)
  }]
});

mongoose.model('User', UserSchema);
