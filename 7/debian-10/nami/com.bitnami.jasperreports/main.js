'use strict';

const fs = require('fs');
const volumeFunctions = require('./lib/volume')($app);
const handlerSelector = require('./lib/handlers/selector');
const componentFunctions = require('./lib/component')($app);
const networkFunctions = require('./lib/network')($app);

const java = $modules['com.bitnami.java'];

$app.postInstallation = function() {
  const tomcatHandler = handlerSelector.getHandler('jspServer', 'tomcat', {cwd: $app.installdir});
  const opts = {
    variation: $app.databaseType,
    name: $app.databaseName,
    user: $app.databaseUser,
    password: $app.databasePassword,
    host: $app.databaseServerHost,
    port: $app.databaseServerPort,
  }
  
  $app.trace('Bootstraping with opts:');
  $app.trace(opts);

  const databaseHandler = handlerSelector.getHandler('database', opts, {cwd: $app.installdir});
  componentFunctions.normalizeDirectories($app.applicationDirectories);
  $app.info('Preparing JasperReports environment...');
    tomcatHandler.setInstallingPage();
  tomcatHandler.deploy($app.installdir, {as: 'jasperserver'});

  if (!volumeFunctions.isInitialized($app.persistDir)) {
    
    databaseHandler.checkConnection();
    $app.helpers.populateDatabase(databaseHandler);

    $app.info('Configuring JasperReports settings...');
    $app.helpers.configureDatabase(databaseHandler);
    $app.helpers.configure({
      appServerType: 'tomcat8',
      appServerDir: tomcatHandler.installdir,
    });
    $app.helpers.configureSMTP(
      $app.smtpHost,
      $app.smtpPort,
      $app.smtpProtocol,
      $app.smtpUser,
      $app.smtpPassword,
      $app.smtpEmail,
      tomcatHandler.httpPort
    );

    $app.info('Deploying JasperReports...');
    $app.helpers.deploySkeleton(databaseHandler);

    $app.info('Configuring user credentials...');
    $app.helpers.configureUserCredentials(databaseHandler);
    // Disable JNDI
    $file.append('WEB-INF/classes/resfactory.properties', 'tbeller.usejndi=false');
    volumeFunctions.prepareDataToPersist($app.dataToPersist);
  } else {
    $app.debug('Existing installation, restoring...');
    databaseHandler.checkConnection();
    volumeFunctions.restorePersistedData($app.dataToPersist);

    // The configuration file is persisted and JDBC driver might have changed
    const jdbcVersion = $file.read($file.join($app.installdir, 'buildomatic/conf_source/db/'+ $app.databaseType +'/db.properties'))
      .match(/^maven.jdbc.version=(.*)/m)[1];

    // Fix bug introduced in 7.8.0-debian-10-r0
    // Reported in: https://github.com/bitnami/bitnami-docker-jasperreports/issues/84
    const confFile = fs.realpathSync($file.join($app.installdir, 'buildomatic/default_master.properties'));
    $file.substitute(confFile,
      /maven\\\.jdbc\\\.version/, 'maven.jdbc.version', {type: 'regexp', abortOnUnmatch: false, global: true});

    $app.helpers.configure({'maven.jdbc.version': jdbcVersion});

    $os.runProgram('sh', 'js-upgrade-samedb-ce.sh', {
      cwd: `${$app.installdir}/buildomatic`,
      logCommand: 'true',
      env: {JAVA_HOME: java.installdir},
    });
    $app.helpers.createLogs();
  }
  $app.helpers.configureTLSForSMTP();
  tomcatHandler.removeInstallingPage({redirectTo: '/jasperserver'});
  componentFunctions.configurePermissions([
    'WEB-INF/logs/',
    `${$app.installdir}/.jrsks`,
    `${$app.installdir}/.jrsksp`],
  {
    user: tomcatHandler.user,
    group: tomcatHandler.group,
  });

  componentFunctions.printProperties({
    'Site URL': `${networkFunctions.getMachineIp()}:${tomcatHandler.httpPort}`,
    'Username': $app.username,
    'Password': $app.password,
  });
};
