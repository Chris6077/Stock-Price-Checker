/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';
let nasdaqHandler = require("../controllers/nasdaqHandler.js");

module.exports = function (app) {
  let handler = new nasdaqHandler();
  app.route('/api/stock-prices').get(function (req, res){
      let symbol = req.query.stock;
      let like = req.query.like || false;
      let IP = req.get('x-forwarded-for').split(",")[0] || req.ip.split(",")[0];
      let prices = null;
      let likes = null;
      let compare = Array.isArray(symbol);
      Array.isArray(symbol) ? (prices = [], likes = []) : (prices = null, likes = null);
      let callback = (state, data) => {
        if (state == 'prices') compare ? prices.push(data) : prices = data;
        else compare ? likes.push(data) : likes = data;      
        if (compare && prices.length == 2 && likes.length == 2) {
          if (prices[0].stock == likes[0].stock) {
            prices[0].rel_likes = likes[0].likes - likes[1].likes;
            prices[1].rel_likes = likes[1].likes - likes[0].likes;
          } else {
            prices[0].rel_likes = likes[1].likes - likes[0].likes;
            prices[1].rel_likes = likes[0].likes - likes[1].likes;
          }
          res.status(200).json({prices});
        } else if (!compare && prices && likes !== null) {
          prices.likes = likes.likes;
          res.status(200).json({prices});
        }
      };
      if (compare) {
        handler.getPrice(symbol[0], callback);
        handler.getLikes(symbol[0], like, IP, callback); 
        handler.getPrice(symbol[1], callback);
        handler.getLikes(symbol[1], like, IP, callback);
      } else {
        handler.getPrice(symbol, callback);
        handler.getLikes(symbol, like, IP, callback);
      }
    });
};