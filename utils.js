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

  processTweet: function(text) {
    return text.replace(/\\n+/, ' ').replace('&amp;', '&');
  }

}
