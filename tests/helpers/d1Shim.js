// Minimal in-memory stand-in for a Cloudflare D1 binding, backed by Node's
// built-in SQLite so the event signup logic runs against the real SQL from
// d1/schema.sql instead of a mock.
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

const schema = readFileSync(new URL('../../d1/schema.sql', import.meta.url), 'utf8')

// Only the event signup statements: the rest of the schema depends on tables
// and fixtures these tests do not need.
const signupStatements = schema
  // Strip comments first: they contain semicolons that would split statements.
  .replace(/--.*$/gm, '')
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => /CREATE (?:TABLE|INDEX) IF NOT EXISTS (?:event_pages|events|signups|idx_signups_)/.test(statement))

export function createD1() {
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  for (const statement of signupStatements)
    db.exec(statement)

  function statement(sql, params = []) {
    const execute = () => {
      const results = db.prepare(sql).all(...params).map(row => ({ ...row }))
      const { changes } = db.prepare('SELECT changes() AS changes').get()
      const { id } = db.prepare('SELECT last_insert_rowid() AS id').get()
      return { success: true, results, meta: { changes, last_row_id: id } }
    }

    return {
      bind: (...values) => statement(sql, values),
      first: async () => execute().results[0] ?? null,
      all: async () => execute(),
      run: async () => execute(),
      // Used by batch(), which needs the rows and the change count together.
      _execute: execute,
    }
  }

  return {
    prepare: sql => statement(sql),
    async batch(statements) {
      db.exec('BEGIN')
      try {
        const results = statements.map(entry => entry._execute())
        db.exec('COMMIT')
        return results
      }
      catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
  }
}
