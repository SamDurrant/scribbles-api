const knex = require('knex')
const app = require('../src/app')
const supertest = require('supertest')
const { expect } = require('chai')

const { makeNotesArray, makeMaliciousNote } = require('./notes.fixtures')
const { makeFoldersArray } = require('./folders.fixtures')

describe('Notes Endpoints', function () {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect  from db', () => db.destroy())

  before('clean the table', () =>
    db.raw('TRUNCATE folders, notes RESTART IDENTITY CASCADE')
  )

  afterEach('cleanup', () =>
    db.raw('TRUNCATE folders, notes RESTART IDENTITY CASCADE')
  )

  describe(`GET /api/notes`, () => {
    context(`Given no notes`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get('/api/notes').expect(200, [])
      })
    })

    context(`Given there are notes`, () => {
      const testNotes = makeNotesArray()
      const testFolders = makeFoldersArray()

      beforeEach('insert notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => db.into('notes').insert(testNotes))
      })

      it(`responds with 200 and all of the notes`, () => {
        return supertest(app).get('/api/notes').expect(200, testNotes)
      })
    })

    context(`Given XSS attact content`, () => {
      const { maliciousNote, expectedNote } = makeMaliciousNote()
      const testFolders = makeFoldersArray()

      beforeEach('insert notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => db.into('notes').insert(maliciousNote))
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200)
          .expect((res) => {
            expect(res.body[0].id).to.eql(expectedNote.id)
            expect(res.body[0].name).to.eql(expectedNote.name)
            expect(res.body[0].content).to.eql(expectedNote.content)
            expect(res.body[0].date_created).to.eql(expectedNote.date_created)
            expect(res.body[0].folder_id).to.eql(expectedNote.folder_id)
          })
      })
    })
  })

  describe(`POST /api/notes`, () => {
    const testFolders = makeFoldersArray()

    beforeEach('insert notes', () => {
      return db.into('folders').insert(testFolders)
    })

    it(`creates a note, responding with 201 and the new note`, () => {
      const newNote = {
        name: 'new note',
        content: 'etc etc etc',
        folder_id: 1,
      }

      return supertest(app)
        .post('/api/notes')
        .send(newNote)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).to.eql(newNote.name)
          expect(res.body.content).to.eql(newNote.content)
          expect(res.body.folder_id).to.eql(newNote.folder_id)
          expect(res.body).to.have.property('date_created')
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`)
        })
        .then((postRes) =>
          supertest(app)
            .get(`/api/notes/${postRes.body.id}`)
            .expect(postRes.body)
        )
    })

    const requiredFields = ['name', 'content', 'folder_id']

    requiredFields.forEach((field) => {
      const newNote = {
        name: 'new note',
        content: 'etc etc etc',
        folder_id: 1,
      }

      it(`responds with 400 and an error message when '${field}' is missing`, () => {
        delete newNote[field]

        return supertest(app)
          .post('/api/notes')
          .send(newNote)
          .expect(400, {
            error: {
              message: `Missing ${field} in request body`,
            },
          })
      })
    })

    context(`Given XSS attact content`, () => {
      const { maliciousNote, expectedNote } = makeMaliciousNote()

      it('removes XSS attack content', () => {
        return supertest(app)
          .post('/api/notes')
          .send(maliciousNote)
          .expect(201)
          .expect((res) => {
            expect(res.body.name).to.eql(expectedNote.name)
            expect(res.body.content).to.eql(expectedNote.content)
            expect(res.body.folder_id).to.eql(expectedNote.folder_id)
            expect(res.body).to.have.property('date_created')
            expect(res.body).to.have.property('id')
          })
      })
    })
  })

  describe(`GET /api/notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        return supertest(app)
          .get('/api/notes/1')
          .expect(404, {
            error: {
              message: `Note does not exist`,
            },
          })
      })
    })

    context(`Given there are notes in the database`, () => {
      const testFolders = makeFoldersArray()
      const testNotes = makeNotesArray()
      const noteId = 1

      beforeEach('insert notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => db.into('notes').insert(testNotes))
      })

      it(`responds with 200 and the specified note`, () => {
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(200, testNotes[noteId - 1])
      })
    })

    context(`Given XSS attact content`, () => {
      const { maliciousNote, expectedNote } = makeMaliciousNote()
      const testFolders = makeFoldersArray()

      beforeEach('insert notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => db.into('notes').insert(maliciousNote))
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/notes/${maliciousNote.id}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).to.eql(expectedNote.id)
            expect(res.body.name).to.eql(expectedNote.name)
            expect(res.body.content).to.eql(expectedNote.content)
            expect(res.body.date_created).to.eql(expectedNote.date_created)
            expect(res.body.folder_id).to.eql(expectedNote.folder_id)
          })
      })
    })
  })

  describe(`DELETE /api/notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        return supertest(app)
          .get('/api/notes/1')
          .expect(404, {
            error: {
              message: `Note does not exist`,
            },
          })
      })
    })

    context(`Given there are notes in the database`, () => {
      const testFolders = makeFoldersArray()
      const testNotes = makeNotesArray()
      const noteId = 1

      beforeEach('insert notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => db.into('notes').insert(testNotes))
      })

      it(`responds with 204 and removes the note`, () => {
        const expectedNotes = testNotes.filter((note) => note.id !== noteId)
        return supertest(app)
          .delete(`/api/notes/${noteId}`)
          .expect(204)
          .then(() => supertest(app).get(`/api/notes`).expect(expectedNotes))
      })
    })
  })

  describe(`PATCH /api/notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        return supertest(app)
          .get('/api/notes/1')
          .expect(404, {
            error: {
              message: `Note does not exist`,
            },
          })
      })
    })

    context(`Given there are notes in the database`, () => {
      const testFolders = makeFoldersArray()
      const testNotes = makeNotesArray()

      beforeEach('insert notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => db.into('notes').insert(testNotes))
      })

      it(`responds with 204 and updates the note`, () => {
        const noteId = 1
        const updatedNote = {
          name: 'new name',
          content: 'brand new content',
          folder_id: testNotes[noteId - 1].folder_id,
        }
        const expectedNote = {
          ...testNotes[noteId - 1],
          ...updatedNote,
        }

        return supertest(app)
          .patch(`/api/notes/${noteId}`)
          .send(updatedNote)
          .expect(204)
          .then(() =>
            supertest(app).get(`/api/notes/${noteId}`).expect(expectedNote)
          )
      })

      it(`responds with 400 when required fields are missing`, () => {
        const idToUpdate = 1

        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send({ irrelevantField: 'i love my dog' })
          .expect(400, {
            error: {
              message: `Request body must contain 'name', 'content' and  'folder_id'`,
            },
          })
      })
    })
  })
})
