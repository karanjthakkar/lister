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
    list_mode: String, //"private", "public"
    list_member_count: String,
    list_subscriber_count: String,
    list_description: String,
    list_name: String,
    list_created_at: String,
    list_added_at: {
      type: String,
      default: Date.now
    }
  }],
  tweets_seen: [{
    tweet_id: String,
    tweet_action: String //RT, FAV, DISCARD (Future: Reply, Quote)
  }]
});

mongoose.model('User', UserSchema);
