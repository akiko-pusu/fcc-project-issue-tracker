/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict'

const ObjectId = require('mongodb').ObjectID

const {
  body
} = require('express-validator')

require('dotenv').config()

const mongoUtil = require('../connection.js')
// const db = mongoUtil.getDb()

const ISSUE_KEYS = [
  '_id',
  'issue_title',
  'issue_text',
  'created_on',
  'updated_on',
  'created_by',
  'assigned_to',
  'open',
  'status_text',
  'project'
]

const parseQuery = (query) => {
  const result = {}
  ISSUE_KEYS.forEach((key) => {
    if (query && Object.prototype.hasOwnProperty.call(query, key)) {
      // NOTE: params are passed as String, so needs to convert into boolean.
      if (key === 'open') {
        result[key] = query[key].toLowerCase() === 'true'
      } else {
        result[key] = query[key]
      }
    }
  })
  return result
}

// for Bulk escape posted data
const validateBody = [
  body('*').trim().escape()
]

const parseBody = (body, isInsert) => {
  const result = {}
  ISSUE_KEYS.forEach((key) => {
    if (body && Object.prototype.hasOwnProperty.call(body, key)) {
      if (key === 'created_by' && isInsert === false) {
        return
      }

      if (!body[key] || body[key].length === '') {
        return
      }
      result[key] = body[key]
    }

    // NOTE: params are passed as String, so needs to convert into boolean.
    if (key === 'created_on' && isInsert === true) {
      result[key] = new Date()
    }
    if (key === 'updated_on') {
      result[key] = new Date()
    }
    if (key === 'open' && isInsert) {
      result[key] = true
    }
  })
  return result
}

const hasRequiredField = (fieldsObject) => {
  const requiredField = ['issue_title', 'issue_text', 'created_by']
  const fields = Object.keys(fieldsObject)
  return fields.filter(e => requiredField.indexOf(e) !== -1).length === requiredField.length
}

module.exports = (app) => {
  app.route('/api/issues/:project')
    .get(async (req, res) => {
      const project = req.params.project
      let query = {}
      if (req.query) {
        query = parseQuery(req.query)
      }

      // merge condition
      const condition = Object.assign({
        'project': project
      }, query)
      const db = mongoUtil.getDb()
      const collection = db.collection('issues')

      let results = await collection.find(condition).toArray()
      return res.json(results)
    })

    /*
      'issue_title',
      'issue_text',
      'created_on',
      'updated_on',
      'created_by',
      'assigned_to',
      'open',
      'status_text',
      'project'

      User insertOne and async / await
    */
    .post(validateBody, async (req, res) => {
      const project = req.params.project

      // Generate document object
      let body = parseBody(req.body, true)
      const document = Object.assign({
        'project': project
      }, body)

      if (!hasRequiredField(document)) {
        res.status(400)
        return res.send(`could not save issue`)
      }

      const db = mongoUtil.getDb()
      const collection = db.collection('issues')
      await collection.insertOne(document)
      return res.json(document)
    })

    .put(validateBody, async (req, res) => {
      const project = req.params.project
      // Generate document object
      let body = parseBody(req.body, false)
      const id = body['_id']

      // _id must be a single String of 12 bytes or a string of 24 hex characters
      if (id === undefined || id.length === 0 || !ObjectId.isValid(id)) {
        res.status(400)
        return res.send('_id error')
      }

      try {
        const query = {
          '_id': ObjectId(id)
        }
        let document = body
        delete document._id

        if (Object.keys(document).length === 1 && Object.keys(document)[0] === 'updated_on') {
          return res.send('no updated field sent')
        }

        document = Object.assign({
          'project': project
        }, document)

        const update = {
          '$set': document
        }

        const db = mongoUtil.getDb()
        const collection = db.collection('issues')
        const result = await collection.updateOne(query, update)

        if (result.modifiedCount === 0) {
          res.status(404)
          return res.send(`could not update ${id}`)
        }
        return res.json(document)
      } catch (e) {
        res.status(404)
        console.log(e)
        return res.send(`could not update ${id}`)
      }
    })

    .delete(validateBody, async (req, res) => {
      let body = parseBody(req.body, false)
      const id = body['_id']

      // _id must be a single String of 12 bytes or a string of 24 hex characters
      if (id === undefined || id.length === 0 || !ObjectId.isValid(id)) {
        res.status(400)
        return res.send('_id error')
      }

      try {
        const query = {
          '_id': new ObjectId(id)
        }
        const db = mongoUtil.getDb()
        const collection = db.collection('issues')
        const result = await collection.deleteOne(query)

        if (result.deletedCount === 0) {
          res.status(404)
          return res.send(`could not delete ${id}`)
        }
        return res.send(`deleted ${id}`)
      } catch (e) {
        res.status(404)
        return res.send(`could not delete ${id}`)
      }
    })
}
