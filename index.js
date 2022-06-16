var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var async = require('async');
var debug = require('debug')('marv:oracle-driver');
var marv = require('marv');
var supportedDirectives = ['audit', 'comment', 'skip'];
var pkg = require('./package.json');

module.exports = function(options) {

  var config = _.merge({ table: 'migrations', connection: {} }, _.omit(options, 'logger'));
  var logger = options.logger || console;
  var SQL = {
    ensureMigrationsTable: load('ensure-migrations-table.sql'),
    ensureMigrationsLockTable: load('ensure-migrations-lock-table.sql'),
    retrieveMigrations: load('retrieve-migrations.sql'),
    dropMigrationsTable: load('drop-migrations-table.sql'),
    dropMigrationsLockTable: load('drop-migrations-lock-table.sql'),
    lockMigrationsLockTable: load('lock-migrations-lock-table.sql'),
    unlockMigrationsLockTable: load('unlock-migrations-lock-table.sql'),
    insertMigration: load('insert-migration.sql')
  };
  var oracledb = config.oracledb || require('oracledb');
  var lockClient;
  var migrationClient;
  var userClient;

  function connect(cb) {
    debug('Connecting to %s', getLoggableUrl());
    async.series({
      lockClient: oracledb.getConnection.bind(oracledb, config.connection),
      migrationClient: oracledb.getConnection.bind(oracledb, config.connection),
      userClient: oracledb.getConnection.bind(oracledb, config.connection),
    }, function(err, clients) {
      if (err) return cb(err);
      lockClient = clients.lockClient;
      migrationClient = clients.migrationClient;
      userClient = clients.userClient;
      cb();
    });
  }

  function disconnect(cb) {
    debug('Disconnecting from %s', getLoggableUrl());
    async.series([
      lockClient.close.bind(lockClient),
      migrationClient.close.bind(migrationClient),
      userClient.close.bind(userClient)
    ], guard(cb));
  }

  function dropMigrations(cb) {
    debug('Dropping migrations from %s', getLoggableUrl());
    async.series([
      ensureScript(SQL.dropMigrationsTable, 942),
      ensureScript(SQL.dropMigrationsLockTable, 942),
    ], cb);
  }

  function ensureMigrations(cb) {
    debug('Ensure migration tables');
    async.series([
      ensureScript(SQL.ensureMigrationsTable, 955),
      ensureScript(SQL.ensureMigrationsLockTable, 955),
    ], guard(cb));
  }

  function ensureScript(script, duplicateCode) {
    return function(cb) {
      migrationClient.execute(script, function(err) {
        if (err && err.errorNum === duplicateCode) return cb();
        if (err) return cb(err);
        return cb();
      });
    };
  }

  function lockMigrations(cb) {
    debug('Locking migrations');
    lockClient.execute(SQL.lockMigrationsLockTable, cb);
  }

  function unlockMigrations(cb) {
    debug('Unlocking migrations');
    lockClient.execute(SQL.unlockMigrationsLockTable, cb);
  }

  function getMigrations(cb) {
    migrationClient.execute(SQL.retrieveMigrations, [], { maxRows: 0 }, function(err, result) {
      if (err) return cb(err);
      cb(null, _.map(result.rows, function(row) {
        return {
          level: row[0],
          comment: row[1],
          timestamp: row[2],
          checksum: row[3],
          namespace: row[4],
        };
      }));
    });
  }

  function runMigration(migration, cb) {
    debug('Run migration');
    _.defaults(migration, { directives: {}  });

    checkDirectives(migration.directives);

    if (/^true$/i.test(migration.directives.skip)) {
      debug('Skipping migration %s: %s\n%s', migration.level, migration.comment, migration.script);
      return cb();
    }

    debug('Run migration %s: %s\n%s', migration.level, migration.comment, migration.script);
    userClient.execute(migration.script, function(err) {
      if (err) return cb(decorate(err, migration));
      if (auditable(migration)) {
        return migrationClient.execute(SQL.insertMigration, [
          migration.level,
          migration.directives.comment || migration.comment,
          migration.timestamp,
          migration.checksum,
          migration.namespace || 'default'
        ], { autoCommit: true }, function(err) {
          if (err) return cb(decorate(err, migration));
          cb();
        });
      }
      cb();
    });
  }

  function checkDirectives(directives) {
    var unsupportedDirectives = _.chain(directives).keys().difference(supportedDirectives).value();
    if (unsupportedDirectives.length === 0) return;
    if (!config.quiet) {
      logger.warn('Ignoring unsupported directives: %s. Try upgrading %s.', unsupportedDirectives, pkg.name);
    }
  }

  function auditable(migration) {
    if (migration.hasOwnProperty('directives')) return !/^false$/i.test(migration.directives.audit);
    if (migration.hasOwnProperty('audit')) {
      if (!config.quiet) logger.warn("The 'audit' option is deprecated. Please use 'directives.audit' instead.");
      return migration.audit !== false;
    }
    return true;
  }

  function getLoggableUrl() {
    return config.connection.connectionString;
  }

  function load(filename) {
    return fs.readFileSync(path.join(__dirname, 'sql', filename), 'utf-8').replace(/migrations/g, config.table);
  }

  function guard(cb) {
    return function(err) {
      cb(err);
    };
  }

  function decorate(err, migration) {
    return _.merge(err, { migration: migration });
  }

  return {
    connect: connect,
    disconnect: disconnect,
    dropMigrations: dropMigrations,
    ensureMigrations: ensureMigrations,
    lockMigrations: lockMigrations,
    unlockMigrations: unlockMigrations,
    getMigrations: getMigrations,
    runMigration: runMigration
  };
};
