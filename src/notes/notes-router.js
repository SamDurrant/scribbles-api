const express = require('express')
const xss = require('xss')
const path = require('path')
const NotesService = require('./notes-service')

const notesRouter = express.Router()
const jsonParser = express.json()

const serializeNote = (note) => ({
  id: note.id,
  name: xss(note.name),
  content: xss(note.content),
  date_created: note.date_created,
  folder_id: note.folder_id,
})

notesRouter
  .route('/')
  .get((req, res, next) => {
    NotesService.getAllNotes(req.app.get('db'))
      .then((notes) => {
        return res.json(notes.map(serializeNote))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { name, content, folder_id } = req.body
    const newNote = { name, content, folder_id }

    for (const [key, value] of Object.entries(newNote)) {
      if (value == null) {
        return res.status(400).json({
          error: {
            message: `Missing ${key} in request body`,
          },
        })
      }
    }

    NotesService.insertNote(req.app.get('db'), newNote).then((note) => {
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${note.id}`))
        .json(serializeNote(note))
    })
  })

module.exports = notesRouter
