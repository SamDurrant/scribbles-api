const FoldersService = {
  getAllFolders(db) {
    return db.select('*').from('folders')
  },
  getById(db, id) {
    return db.from('folders').select('*').where('id', id).first()
  },
  insertFolder(db, newFolder) {
    return db
      .insert(newFolder)
      .into('folders')
      .returning('*')
      .then((rows) => {
        return rows[0]
      })
  },
  deleteFolder(db, id) {
    return db('folders').where({ id }).delete()
  },
  updateFolder(db, id, newFolderFields) {
    return db('folders').where('id', id).update(newFolderFields)
  },
}

module.exports = FoldersService

// .returning() method return an array. If expecting an object, the object must be pulled out of the array

// .where('id', id) ==== .where({ id })
