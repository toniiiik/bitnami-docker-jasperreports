'use strict';

const _ = require('lodash');
const $os = require('harpoon-utils/os');
const { SSL_OP_EPHEMERAL_RSA } = require('constants');

const postgresqlCore = $modules['com.bitnami.postgresql-client'];

/**
 * PostgreSQL handler functions for a database.
 * @namespace handler.databases.postgresql.database
 */
class PostgresqlDatabase {
  constructor(connection) {
    this.connection = connection;
    this.name = '';
  }

  /**
   * Wrapper of {@link base-functions.database.postgresql~create create} in a specific database
   * @function handler.databases.postgresql.database~create
   */
  create() {
    return postgresqlCore.createDatabase(this.name, this.connection);
  }

  /**
   * Wrapper of {@link base-functions.database.postgresql~drop drop} in a specific database
   * @function handler.databases.postgresql.database~drop
   */
  drop() {
    return postgresqlCore.dropDatabase(this.name, this.connection);
  }

  /**
   * Wrapper of {@link base-functions.database.postgresql~set set} in a specific database
   * @function handler.databases.postgresql.database~set
   */
  set(table, key, value, options) {
    const _options = _.defaults(options || {}, this.connection);

    return postgresqlCore.set(this.name, table, key, value, _options);
  }

  /**
   * Wrapper of {@link base-functions.database.postgresql~execute execute} in a specific database
   * @function handler.databases.postgresql.database~execute
   * @example
   * handler.database('mydb').execute('SELECT * FROM mytable')
   */
  execute(command, options) {
    const _options = _.defaults(options || {}, {database: this.name, cwd: this.cwd}, this.connection);
    postgresqlCore.execute(command, _options);
  }

  /**
   * Wrapper of {@link base-functions.database.postgresql~executeSqlFile executeSqlFile} in a specific database
   * @function handler.databases.postgresql.database~executeSqlFile
   * @example
   * handler.database('mydb').execute('./file.sql')
   */
  executeFile(file, options) {
    if (_.isEmpty(file)) {
      throw new Error('SQL file path is empty');
    }

    const _opts =_.defaults(options || {}, {database: this.name, cwd: this.cwd}, this.connection);

    const commandArguments = ['-t'];
    const commandOptions = {
      port: '-p',
      host: '-h',
      database: '-d',
      user: '-U',
    };

    _.each(commandOptions, (value, key) => {
      if (!_.isEmpty(_opts[key])) commandArguments.push(`${value}${_opts[key]}`);
    });
    commandArguments.push(`-f${file}`);
    $app.trace(`[execute] Executing psql with parameters ${commandArguments}`);
    const binDir = '/opt/bitnami/postgresql/bin';//$file.dirname($os.findInPath('psql'));
    return $os.runProgram($file.join(binDir, 'psql'), commandArguments, {env: {PGPASSWORD: _opts.password}});
  }

  /**
   * Wrapper of {@link base-functions.database.postgresql~get get} in a specific database
   * @function handler.databases.postgresql.database~get
   */
  get(table, key, options) {
    const _options = _.defaults(options || {}, this.connection);
    return postgresqlCore.get(this.name, table, key, _options);
  }

  /**
   * Wrapper of {@link base-functions.database.postgresql~insert insert} in a specific database
   * @function handler.databases.postgresql.database~insert
   */
  insert(table, data) {
    return _.map(data, (row) => postgresqlCore.insert(this.name, table, row, this.connection));
  }
}

module.exports = PostgresqlDatabase;
