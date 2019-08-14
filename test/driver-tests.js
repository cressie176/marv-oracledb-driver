var Hath = require('hath');
var marv = require('marv');
var path = require('path');
var oracledb = require('oracledb');
var fs = require('fs');
var async = require('async');

function shouldRunMigration(t, done) {
  oracledb.getConnection(t.locals.config.connection, function(err, connection) {
    if (err) throw err;
    dropTables(t, connection, function(err) {
      if (err) throw err;
      marv.scan(path.join(__dirname, 'migrations'), function(err, migrations) {
        if (err) throw err;
        marv.migrate(migrations, t.locals.driver, function(err) {
          if (err) throw err;
          connection.execute('SELECT * FROM foo', [], { maxRows: 0 }, function(err, result) {
            if (err) throw err;
            t.assertEquals(result.rows.length, 1);
            t.assertEquals(result.rows[0][0], 1);
            t.assertEquals(result.rows[0][1], 'foo');

            connection.execute('SELECT * FROM bar', [], { maxRows: 0 }, function(err, result) {
              if (err) throw err;
              t.assertEquals(result.rows.length, 1);
              t.assertEquals(result.rows[0][0], 1);
              t.assertEquals(result.rows[0][1], 'bar');
              connection.close(done);
            });
          });
        });
      });
    });
  });
}

function dropTables(t, connection, cb) {
  async.eachSeries(['drop-migrations.sql', 'drop-migrations-lock.sql', 'drop-foo.sql', 'drop-bar.sql'], function(name, cb) {
    const sql = load(t, ['sql', name]);
    connection.execute(sql, [], { maxRows: 0 }, cb);
  }, cb);
}

function load(t, location) {
  return fs.readFileSync(path.join.apply(null, [__dirname].concat(location)), 'utf-8').replace(/migrations/g, t.locals.config.table);
}

module.exports = Hath.suite('Driver Tests', [
  shouldRunMigration,
]);
