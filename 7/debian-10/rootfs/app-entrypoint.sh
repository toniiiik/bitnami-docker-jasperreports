#!/bin/bash -e

. /opt/bitnami/base/functions
. /opt/bitnami/base/helpers

print_welcome_page

# backward compatibility
if [[ "$DB_TYPE" == "" ]]; then
    export DB_TYPE="mysql"
    export DB_HOST=$MARIADB_HOST 
    export DB_PORT_NUMBER=$MARIADB_PORT_NUMBER 
    export DB_ROOT_PASSWORD=$MARIADB_ROOT_PASSWORD 
    export DB_ROOT_USER=$MARIADB_ROOT_USER 
    export DB_CLIENT_CREATE_DATABASE_NAME=$MYSQL_CLIENT_CREATE_DATABASE_NAME 
    export DB_CLIENT_CREATE_DATABASE_PASSWORD=$MYSQL_CLIENT_CREATE_DATABASE_PASSWORD 
    export DB_CLIENT_CREATE_DATABASE_PRIVILEGES=$MYSQL_CLIENT_CREATE_DATABASE_PRIVILEGES 
    export DB_CLIENT_CREATE_DATABASE_USER=$MYSQL_CLIENT_CREATE_DATABASE_USER 
    export DB_CLIENT_ENABLE_SSL=$MYSQL_CLIENT_ENABLE_SSL 
    export DB_CLIENT_SSL_CA_FILE=$MYSQL_CLIENT_SSL_CA_FILE 
fi

if [[ "$1" == "nami" && "$2" == "start" ]] || [[ "$1" == "/init.sh" ]]; then
    nami_initialize tomcat "${DB_TYPE}-client" jasperreports
    info "Starting gosu... "
fi

exec tini -- "$@"
