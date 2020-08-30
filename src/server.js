const app = require('./app')
const { PORT, DATABASE_URL } = require('./config')
const knex = require('knex')

const db = knex({
  client: 'pg',
  connection: DATABASE_URL,
})

app.set('db', db) // using .set() method, we can set property called 'db' to knex instance of value

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})
