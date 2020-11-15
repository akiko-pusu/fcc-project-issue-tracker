/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

const chaiHttp = require('chai-http')
const chai = require('chai')
const assert = chai.assert
const server = require('../server')

chai.use(chaiHttp)

suite('Functional Tests', function () {

  suite('POST /api/issues/{project} => object with issue data', () => {
    test('Every field filled in', (done) => {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - Every field filled in',
          assigned_to: 'Akiko',
          status_text: 'In Progress'
        })
        .end((_err, res) => {
          assert.equal(res.status, 200)
          done()
        })
    }).timeout(8000)

    test('Required fields filled in', (done) => {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - Required fields filled in'
        })
        .end((_err, res) => {
          assert.equal(res.status, 200)
          done()
        })
    }).timeout(8000)

    test('Missing required fields', (done) => {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_text: 'text',
          created_by: 'Functional Test - Every field filled in',
          status_text: 'In QA'
        })
        .end((_err, res) => {
          assert.equal(res.status, 400)
          assert.equal(res.text, 'could not save issue')
          done()
        })
    }).timeout(8000)
  })

  suite('GET /api/issues/{project} => Array of objects with issue data', () => {
    // NOTE: "Passing arrow functions (aka “lambdas”) to Mocha is discouraged."
    //   https://mochajs.org/#arrow-functions
    // Ref. https://github.com/mochajs/mocha/issues/2018
    // But this test code, I wrote functions as arrow functions with workaround.
    test('No filter', (done) => {
      chai.request(server)
        .get('/api/issues/test')
        .query({})
        .end((_err, res) => {
          assert.equal(res.status, 200)
          assert.isArray(res.body)
          assert.property(res.body[0], 'issue_title')
          assert.property(res.body[0], 'issue_text')
          assert.property(res.body[0], 'created_on')
          assert.property(res.body[0], 'updated_on')
          assert.property(res.body[0], 'created_by')
          assert.property(res.body[0], 'assigned_to')
          assert.property(res.body[0], 'open')
          assert.property(res.body[0], 'status_text')
          assert.property(res.body[0], '_id')

          // get LastObject
          lastObject = res.body.pop()
          done()
        })
    }).timeout(8000)

    // Select open status only
    test('One filter', (done) => {
      chai.request(server)
        .get('/api/issues/test')
        .query({
          'open': true
        })
        .end((_err, res) => {
          assert.equal(res.status, 200)
          const firstIssue = res.body[0]
          assert.equal(firstIssue.project, 'test')
          done()
        })
    }).timeout(8000) // Timeout should be bind to the 'it' (test) context.

    // Select open status and assigned_to
    test('Multiple filters (test for multiple fields you know will be in the db for a return)', (done) => {
      chai.request(server)
        .get('/api/issues/test')
        .query({
          'open': true,
          'assigned_to': 'Akiko',
          'status_text': 'In Progress'
        })
        .end((_err, res) => {
          assert.equal(res.status, 200)
          const firstIssue = res.body[0]
          assert.equal(firstIssue.status_text, 'In Progress')
          done()
        })
    }).timeout(8000)
  })

  suite('PUT /api/issues/{project} => text', () => {
    test('No body and no _id', (done) => {
      chai.request(server)
        .put('/api/issues/test')
        .send({})
        .end((_err, res) => {
          assert.equal(res.status, 400)
          assert.equal(res.text, '_id error')
          done()
        })
    }).timeout(8000)

    test('Invalid _id', (done) => {
      const _id = '8faf84b9d50ae9233ea21a13'
      chai.request(server)
        .put('/api/issues/test')
        .send({
          _id: _id,
          issue_title: 'Title',
          issue_text: 'text',
          assigned_to: 'Chai and Mocha',
          open: false,
          status_text: 'In QA'
        })
        .end((_err, res) => {
          assert.equal(res.status, 404)
          assert.equal(res.text, `could not update ${_id}`)
          done()
        })
    }).timeout(8000)

    test('One field to update', (done) => {
      const _id = lastObject._id
      chai.request(server)
        .put('/api/issues/test')
        .send({
          _id: _id,
          issue_title: `Title ${new Date()}`,
          issue_text: 'text',
          assigned_to: 'Chai and Mocha',
          open: false,
          status_text: 'In QA'
        })
        .end((_err, res) => {
          assert.equal(res.status, 200)
          done()
        })
    }).timeout(8000)

    test('Multiple fields to update', function (done) {
      const _id = lastObject._id
      chai.request(server)
        .put('/api/issues/test')
        .send({
          _id: _id,
          issue_title: `Title ${new Date()}`,
          issue_text: 'text for Updated',
          assigned_to: 'Chai and Mocha and Multi Update',
          open: false,
          status_text: 'In QA'
        })
        .end((_err, res) => {
          assert.equal(res.status, 200)
          done()
        })
    }).timeout(8000)
  })

  suite('DELETE /api/issues/{project} => text', () => {
    test('No _id', (done) => {
      chai.request(server)
        .delete('/api/issues/test')
        .send({})
        .end((_err, res) => {
          assert.equal(res.status, 400)
          assert.equal(res.text, '_id error')
          done()
        })
    }).timeout(8000)

    test('Valid _id', (done) => {
      console.log(lastObject)
      const id = lastObject._id
      chai.request(server)
        .delete('/api/issues/test')
        .send({
          _id: id
        })
        .end((_err, res) => {
          assert.equal(res.status, 200)
          done()
        })
    }).timeout(8000)
  })
})
