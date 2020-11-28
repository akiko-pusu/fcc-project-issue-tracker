'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const apiRoutes = require('./routes/api.js')
const fccTestingRoutes = require('./routes/fcctesting.js')
const runner = require('./test-runner')

const app = express()

const mongoUtil = require('./connection.js')
const path = require('path')
const assetsPath = path.join(__dirname, '/public')

app.use(express.static(assetsPath))

app.use('/public', express.static(process.cwd() + '/public'))
app.use(cors({
  origin: '*'
})) // For FCC testing purposes only

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

// Sample front-end
app.route('/:project/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/issue.html')
  })

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html')
  })

// For FCC testing purposes
fccTestingRoutes(app)

// Routing for API
apiRoutes(app)

// 404 Not Found Middleware
app.use(function (req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found')
})

// Initialize connection once
mongoUtil.connectToServer((err, client) => {
  if (err) {
    console.log(`ERROR: ${err.message}. To restart, run "npm run start"`)
    return
  }

  // Start the application after the database connection is ready
  // Start our server and tests!
  app.listen(process.env.PORT || 3000, function () {
    console.log(`Listening on port ${process.env.PORT}`)
    if (process.env.NODE_ENV === 'test') {
      console.log('Running Tests...')
      setTimeout(function () {
        try {
          runner.run()
        } catch (e) {
          const error = e
          console.log('Tests are not valid:')
          console.log(error)
        }
      }, 3500)
    }
  })
  console.log(`Listening on port 3000`)
})

module.exports = app
