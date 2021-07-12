/* eslint-disable no-template-curly-in-string */
// Disallow template literal placeholder syntax in regular strings [BITNAMI] Necessary to write vars in files
// http://eslint.org/docs/rules/no-template-curly-in-string

'use strict';

const _ = require('lodash');
const fs = require('fs');

const java = $modules['com.bitnami.java'];

$app.helpers.configureSMTP = function(host, port, protocol, user, password, smtpEmail, httpPort) {
  const smtpProperties = [host, port, protocol];
  if (!smtpProperties.some(_.isEmpty)) {
    $app.debug('Configuring SMTP...');
    this.configure({
      'quartz.mail.sender.host': `${host}`,
      'quartz.mail.sender.port': `${port}`,
      'quartz.mail.sender.protocol': `${protocol}`,
      'quartz.mail.sender.username': `${user}`,
      'quartz.mail.sender.password': `${password}`,
      'quartz.mail.sender.from': `${smtpEmail}`,
      'quartz.web.deployment.uri': `http://127.0.0.1:${httpPort}/jasperserver/`,
    });
  } else if (!smtpProperties.every(_.isEmpty)) {
    throw new Error('You should specify host, port and protocol for SMTP configuration');
  }
};

$app.helpers.configureTLSForSMTP = function() {
  // Set the authentication to true, we do not support use SMTP servers without authentication.
  $file.substitute(
    'WEB-INF/applicationContext-report-scheduling.xml',
    /<prop key="mail\.smtp\.auth">false<\/prop>/,
    '<prop key="mail.smtp.auth">true</prop>\n\t\t<prop key="mail.smtp.starttls.enable">true</prop>',
    {abortOnUnmatch: true}
  );
};

$app.helpers.createLogs = function() {
  // Create log file
  $file.touch('WEB-INF/logs/jasperserver.log');
  $file.chmod('WEB-INF/logs/jasperserver.log', '664');
};

$app.helpers.configureDatabase = function(databaseHandler) {
  this.configure({
    'dbPort': $app.databaseServerPort,
    'dbHost': $app.databaseServerHost,
    'dbPassword': $app.databasePassword,
    'dbUsername': $app.databaseUser,
    'js.dbName': $app.databaseName,
    'dbType': $app.databaseType,    
   } );

   if($app.databaseType in ['mysql', 'mariadb']){
    this.configure({
      'jdbcDriverClass': '.*mariadb.*',
      'jdbcDataSourceClass':'.*mariadb.*',
      'maven.jdbc.groupId': '.*mariadb.*',
      'maven.jdbc.artifactId': '.*mariadb.*',
     }, {mode: 'uncomment'});
   }
};
// 'maven.jdbc.version': $app.helpers.getDBClientVersion()
// 
$app.helpers.populateDatabase = function(databaseHandler) {

  const dbType=$app.databaseType;

  databaseHandler.database(databaseHandler.connection.name).executeFile($file.join(
    $app.installdir,
    'buildomatic/install_resources/sql/'+dbType+'/js-create.ddl'
  ));
  databaseHandler.database(databaseHandler.connection.name).executeFile($file.join(
    $app.installdir,
    'buildomatic/install_resources/sql/'+dbType+'/quartz.ddl'
  ));
};

$app.helpers.getDBClientVersion = function() {

  const dbType=$app.databaseType;
  const dbClientFile = $file.glob('buildomatic/conf_source/db/'+dbType+'/jdbc/*.jar');

  $app.trace('Found db drivers:')
  $app.trace(dbClientFile)

  const dbClientVersion = dbClientFile[0].match('(mariadb-java-client-|postgresql-)(.*).jar')[2];
  return dbClientVersion;
};

$app.helpers.deploySkeleton = function(databaseHandler) {

  const dbType=$app.databaseType;

  $app.helpers.createLogs();
  // Avoid deleting buildomatic folder
  $file.substitute('buildomatic/bin/app-server.xml', [{
    pattern: '<var name="warTargetDirDel" value="${fixedAppServerDir}/webapps/${webAppNameDel}"/>',
    value: '<!-- <var name="warTargetDirDel" value="${fixedAppServerDir}/webapps/${webAppNameDel}"/> -->',
  }], {abortOnUnmatch: true});
  // Substitute command "do-js.install.sh" path
  $file.substitute('buildomatic/js-install-ce.sh', [{
    pattern: /^.*do-js-install.sh.*$/m,
    value: `${$app.installdir}/buildomatic/bin/do-js-install.sh ce $*`,
  }], {abortOnUnmatch: true, type: 'regexp', global: false});
  // Substitute admin.jdbcUrl property
  // if( dbType == 'mysql') {

  $app.trace("set admin jdbc connection to: " + 'admin.jdbcUrl=jdbc:' + dbType + '://'
  + `${databaseHandler.connection.host}:${databaseHandler.connection.port}/${databaseHandler.connection.name}`,)

  $file.substitute('buildomatic/conf_source/db/'+dbType+'/db.template.properties', [{
    pattern: /^.*admin.jdbcUrl.*$/m,
    value: 'admin.jdbcUrl=jdbc:' + dbType + '://'
      + `${databaseHandler.connection.host}:${databaseHandler.connection.port}/${databaseHandler.connection.name}`,
  }], {abortOnUnmatch: true, type: 'regexp', global: false});
  // }

  // keystore settings
  const keystoreProperties = $file.join($app.installdir, 'buildomatic/keystore.init.properties');
  $file.append(keystoreProperties, `ks=${$app.installdir}`, {atNewLine: true});
  $file.append(keystoreProperties, `ksp=${$app.installdir}`, {atNewLine: true});

  // Deploy database and populate it.
  $os.runProgram('sh', 'js-ant import-minimal-ce', {
    cwd: `${$app.installdir}/buildomatic`,
    logCommand: 'true',
    input: 'y',
    env: {JAVA_HOME: java.installdir},
  });
  // Deploy JasperReports application.
  $os.runProgram('sh', 'js-install-ce.sh minimal', {
    cwd: `${$app.installdir}/buildomatic`,
    logCommand: 'true',
    input: 'n',
    env: {JAVA_HOME: java.installdir},
  });
};

$app.helpers.configureUserCredentials = function(databaseHandler) {
  const dbType=$app.databaseType;

  // condition API is not compatible cross db types
  // postgresql use sequence
  const whereOpts={
    mysql: {where: {id: 1}},
    postgresql: {condition: "username = 'jasperadmin'"}
  }

  $file.substitute(`buildomatic/bin/js-import-export.sh`, [{
    pattern: 'JAVA_EXEC=java',
    value: `JAVA_EXEC=${java.binDir}/java`,
  }]);
  databaseHandler.database(databaseHandler.connection.name).set(
    'JIUser',
    'username',
    $app.username,
    whereOpts[dbType]
  );
  databaseHandler.database(databaseHandler.connection.name).set(
    'JIUser',
    'emailAddress',
    $app.email,
    whereOpts[dbType]
  );
  $os.runProgram(
    'sh',
    `js-export.sh --users ${$app.username} --output-dir ${$app.installdir}/buildomatic/JS`,
    {
      cwd: `${$app.installdir}/buildomatic`,
      logCommand: 'true',
      env: {JAVA_HOME: java.installdir},
    }
  );
  $file.substitute(
    `buildomatic/JS/users/${$app.username}.xml`,
    [{
      pattern: /<password>.*<\/password>/,
      value: `<password>${$app.password}</password>`,
    }],
    {abortOnUnmatch: true}
  );
  $os.runProgram(
    'sh',
    `js-import.sh --input-dir ${$app.installdir}/buildomatic/JS --update`,
    {
      cwd: `${$app.installdir}/buildomatic`,
      logCommand: 'true',
      env: {JAVA_HOME: java.installdir},
    }
  );
};

$app.helpers.configure = function(properties, options) {
  const dbType=$app.databaseType;
  
  $app.trace('Setting configuration: ');
  $app.trace(properties);
  $app.trace(options);
  options = _.defaults(options || {}, {mode: 'set'});
  let confFile = $file.join($app.installdir, 'buildomatic/default_master.properties');
  if (!$file.exists(confFile)) {
    $app.trace('file does not exists using "buildomatic/sample_conf/' + dbType + '_master.properties"');
    $file.copy('buildomatic/sample_conf/' + dbType + '_master.properties', confFile);
  } 
  confFile = $file.isLink(confFile) ? fs.realpathSync(confFile) : confFile;
  _.each(properties, (v, k) => {
    let value = `${k}=${v}`;
    let pattern = new RegExp(`^#*\\s*${k}.*$`, 'm');
    if (options.mode === 'uncomment') {
      value = `${k}=$1`;
      pattern = new RegExp(`^#*\\s*${k}=(${v})$`, 'm');
    }
    try {
      $file.substitute(confFile, pattern, value, {type: 'regexp', abortOnUnmatch: true, global: false});
    } catch (err) {
      $app.trace('Substitution problem with: ' + `${k}=${v}`)
      throw new Error(err);
    }
  });
};
