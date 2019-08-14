[![Code Style](https://img.shields.io/badge/code%20style-imperative-brightgreen.svg)](https://github.com/guidesmiths/eslint-config-imperative)

# marv-oracledb-driver
An Oracle driver for [marv](https://www.npmjs.com/package/marv)

"If [@cliftonc](https://www.npmjs.com/package/@infinitaslearning/marv-mssql-driver) can do it, @cressie176 can do it better" Anon, 2019

## Usage
```
migrations/
  |- 001.create-table.sql
  |- 002.create-another-table.sql
```

```js
const marv = require('marv')
const oracleDriver = require('marv-oracledb-driver')
const directory = path.join(process.cwd(), 'migrations' )
const driver = oracleDriver({
  table: 'db_migrations',     // defaults to 'migrations'
  connection: {               // the connection sub document is passed directly to oracledb.getConnection
    connectionString: 'localhost:32118/XE',
    user: 'system',
    password: 'Oracle18'
  }
})
marv.scan(directory, (err, migrations) => {
  if (err) throw err
  marv.migrate(migrations, driver, (err) => {
    if (err) throw err
  })
})
```

## Testing
To test marv-oracle-driver you will need to access a test database. We recommend following the instructions [here](https://github.com/fuzziebrain/docker-oracle-xe).

```bash
npm install
npm test
```
