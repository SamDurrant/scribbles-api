const knex = require('knex')
const app = require('../src/app')
const supertest = require('supertest')
const { expect } = require('chai')

const { makeFoldersArray, makeMaliciousFolder } = require('./folders.fixtures')

describe('Folders Endpoints', function () {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () =>
    db.raw('TRUNCATE folders, notes RESTART IDENTITY CASCADE')
  )

  afterEach('cleanup', () =>
    db.raw('TRUNCATE folders, notes RESTART IDENTITY CASCADE')
  )

  describe(`GET /api/folders`, () => {
    context(`Given no folders`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get('/api/folders').expect(200, [])
      })
    })

    context(`Given there are folders`, () => {
      const testFolders = makeFoldersArray()

      beforeEach('insert folders', () => {
        return db.into('folders').insert(testFolders)
      })

      it('responds with 200 and all of the articles', () => {
        return supertest(app).get('/api/folders').expect(200, testFolders)
      })
    })

    context(`Given XSS attack content`, () => {
      const { maliciousFolder, expectedFolder } = makeMaliciousFolder()

      beforeEach('insert malicious folder', () => {
        return db.into('folders').insert([maliciousFolder])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/folders`)
          .expect(200)
          .expect((res) => {
            expect(res.body[0].name).to.eql(expectedFolder.name)
            expect(res.body[0].id).to.eql(expectedFolder.id)
          })
      })
    })
  })

  describe(`POST /api/folders`, () => {
    it(`creates a folder, responding with 201 and the new folder`, function () {
      const newFolder = {
        name: 'New folder name',
      }

      return supertest(app)
        .post('/api/folders')
        .send(newFolder)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).to.eql(newFolder.name)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`)
        })
        .then((postRes) => {
          supertest(app)
            .get(`/api/folders/${postRes.body.id}`)
            .expect(postRes.body)
        })
    })

    const requiredFields = ['name']

    requiredFields.forEach((field) => {
      const newFolder = {
        name: 'Test new folder',
      }

      it(`responds with 400 and an error message when '${field}' is missing`, () => {
        delete newFolder[field]

        return supertest(app)
          .post('/api/folders')
          .send(newFolder)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` },
          })
      })
    })

    context(`Given XSS attack content`, () => {
      const { maliciousFolder, expectedFolder } = makeMaliciousFolder()

      it(`removes XSS attack content`, () => {
        return supertest(app)
          .post(`/api/folders`)
          .send(maliciousFolder)
          .expect(201)
          .expect((res) => {
            expect(res.body.name).to.eql(expectedFolder.name)
          })
      })
    })
  })

  describe(`GET /api/folders/:folder_id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        return supertest(app)
          .get('/api/folders/1')
          .expect(404, { error: { message: `Folder does not exist` } })
      })
    })

    context(`Given there are folders in the database`, () => {
      const testFolders = makeFoldersArray()

      beforeEach('insert folders', () => {
        return db.into('folders').insert(testFolders)
      })

      it('responds with 200 and the specified folder', () => {
        const folderId = 2
        const expectedFolder = testFolders[folderId - 1]

        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(200, expectedFolder)
      })
    })

    context(`Given XSS attack content`, () => {
      const { maliciousFolder, expectedFolder } = makeMaliciousFolder()

      beforeEach('insert malicious folder', () => {
        return db.into('folders').insert([maliciousFolder])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/folders/${maliciousFolder.id}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.name).to.eql(expectedFolder.name)
            expect(res.body.id).to.eql(expectedFolder.id)
          })
      })
    })
  })

  describe(`DELETE /api/folders/:folder_id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        return supertest(app)
          .get('/api/folders/1')
          .expect(404, { error: { message: `Folder does not exist` } })
      })
    })

    context(`Given there are folders in the database`, () => {
      const testFolders = makeFoldersArray()

      beforeEach('insert folders', () => {
        return db.into('folders').insert(testFolders)
      })

      it(`responds with 204 and removes the folder`, () => {
        const idToRemove = 2
        const expectedFolders = testFolders.filter(
          (folder) => folder.id !== idToRemove
        )

        return supertest(app)
          .delete(`/api/folders/${idToRemove}`)
          .expect(204)
          .then((res) =>
            supertest(app).get(`/api/folders`).expect(expectedFolders)
          )
      })
    })
  })

  describe(`PATCH /api/folders/:folder_id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        return supertest(app)
          .get('/api/folders/1')
          .expect(404, { error: { message: `Folder does not exist` } })
      })
    })

    context(`Given there are folders in the database`, () => {
      const testFolders = makeFoldersArray()

      beforeEach('insert folders', () => {
        return db.into('folders').insert(testFolders)
      })

      it(`responds with 204 and updates the folder`, () => {
        const idToUpdate = 2
        const updatedFolder = {
          name: 'the updated name',
        }

        const expectedFolder = {
          ...testFolders[idToUpdate - 1],
          ...updatedFolder,
        }

        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send(updatedFolder)
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/folders/${idToUpdate}`)
              .expect(expectedFolder)
          )
      })

      it(`responds with  400  when no  required fields supplied`, () => {
        const idToUpdate = 2

        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send({ irrelevantField: 'foo bar' })
          .expect(400, {
            error: {
              message: `Request body must contain 'name'`,
            },
          })
      })
    })
  })
})
