let mdb = require('mongodb');
let request = require('request');
let crypto = require('crypto');

function nasdaqHandler() {
  this.getPrice = (symbol, callback) => {
    let res;
    request(
      'https://repeated-alpaca.glitch.me/v1/stock/' + symbol + '/quote',
      (err, response, body) => {
        if (!err && response.statusCode == 200) {
          res = JSON.parse(body);
          callback('prices', {
            stock: res.symbol,
            price: res.latestPrice
          });
        } else {
          callback('prices', { error: 'error getting data from the fcc stock api' });
        }
      }
    );
  };
  this.getLikes = (symbol, like, ip, callback) => {
    mdb.connect(process.env.CONN, (err, db) => {
      let collection = db.collection('nasdaqLikes');
      if (!like) {
        collection.find({ stock: symbol }).toArray((err, doc) => {
          let likes = 0;
          if (doc.length > 0) {
            likes = doc[0].likes.length;
          }
          callback('likes', { stock: symbol, likes: likes });
        });
      } else {
        collection.findAndModify(
          { stock: symbol },
          [],
          { $addToSet: { likes: crypto.createHash('sha512').update(ip, 'utf-8').digest('hex') } },
          { new: true, upsert: true },
          (err, doc) => {
            callback('likes', {
              stock: symbol,
              likes: doc.value.likes.length
            });
          }
        );
      }
    });
  };
}
module.exports = nasdaqHandler;