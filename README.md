[![NPM version](https://img.shields.io/npm/v/marv-oracledb-driver.svg?style=flat-square)](https://www.npmjs.com/package/marv-oracledb-driver)
[![NPM downloads](https://img.shields.io/npm/dm/marv-oracledb-driver.svg?style=flat-square)](https://www.npmjs.com/package/marv-oracledb-driver)
[![Maintainability](https://api.codeclimate.com/v1/badges/1af10f14b0ca55cf61f5/maintainability)](https://codeclimate.com/github/cressie176/marv-oracledb-driver/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/1af10f14b0ca55cf61f5/test_coverage)](https://codeclimate.com/github/cressie176/marv-oracledb-driver/test_coverage)
[![Code Style](https://img.shields.io/badge/code%20style-imperative-brightgreen.svg)](https://github.com/guidesmiths/eslint-config-imperative)
[![Dependency Status](https://david-dm.org/guidesmiths/marv-oracledb-driver.svg)](https://david-dm.org/guidesmiths/marv-oracledb-driver)
[![devDependencies Status](https://david-dm.org/guidesmiths/marv-oracledb-driver/dev-status.svg)](https://david-dm.org/guidesmiths/marv-oracledb-driver?type=dev)

# marv-oracledb-driver
An oracle database driver for [marv](https://www.npmjs.com/package/marv)

## Usage
```
migrations/
  |- 001.create-table.sql
  |- 002.create-another-table.sql
```

### Promises
```js
const marv = require('marv/api/promise'); // <-- Promise API
const driver = require('marv-oracledb-driver');
const directory = path.resolve('migrations');
const connection = {
  // Properties are passed straight oracledb.getConnection
  connectionString: 'localhost:32118/XE',
  user: 'system',
  password: 'Oracle18'
};

const migrations = await marv.scan(directory);
await marv.migrate(migrations, driver({ connection });
// Profit :)
```

### Callbacks
```js
const marv = require('marv/api/callback'); // <-- Callback API
const driver = require('marv-oracledb-driver');
const directory = path.resolve('migrations');
const connection = {
  // Properties are passed straight oracledb.getConnection
  connectionString: 'localhost:32118/XE',
  user: 'system',
  password: 'Oracle18'
};

marv.scan(directory, (err, migrations) => {
  if (err) throw err
  marv.migrate(migrations, driver({ connection }), (err) => {
    if (err) throw err
    // Profit :)
  })
})
```

## Testing
```bash
npm install
npm run docker
npm test
```
