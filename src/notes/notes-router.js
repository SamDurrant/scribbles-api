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

notesRouter.route('/').get((req, res, next) => {
  NotesService.getAllNotes(req.app.get('db'))
    .then((notes) => {
      return res.json(notes.map(serializeNote))
    })
    .catch(next)
})

module.exports = notesRouter
