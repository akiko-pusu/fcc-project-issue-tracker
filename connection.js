require('dotenv').config()

const MongoClient = require('mongodb').MongoClient
const url = process.env.DB

const connectOption = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}

var _db

module.exports = {
  connectToServer: (callback) => {
    MongoClient.connect(url, connectOption, (err, client) => {
      _db = client.db('fcc')
      console.log(_db)
      return callback(err)
    })
  },

  getDb: function () {
    return _db
  }
}
