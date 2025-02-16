FROM docker.io/bitnami/minideb:buster
LABEL maintainer "Bitnami <containers@bitnami.com>"

ENV PATH="/opt/bitnami/java/bin:/opt/bitnami/tomcat/bin:/opt/bitnami/mysql/bin:/opt/bitnami/git/bin:/opt/bitnami/common/bin:/opt/bitnami/nami/bin:$PATH"

COPY prebuildfs /
# Install required system packages and dependencies
RUN install_packages ca-certificates curl fontconfig gzip libaudit1 libc6 libcap-ng0 libcom-err2 libedit2 libcurl4 libffi6 libfreetype6 libgcc1 libgcrypt20 libgmp10 libgnutls30 libgpg-error0 libgssapi-krb5-2 libhogweed4 libicu63 libidn2-0 libjemalloc2 libk5crypto3 libkeyutils1 libkrb5-3 libkrb5support0 libldap-2.4-2 liblzma5 libncurses6 libnettle6 libnghttp2-14 libp11-kit0 libpam0g libpsl5 librtmp1 libsasl2-2 libssh2-1 libssl1.1 libstdc++6 libtasn1-6 libtinfo6 libunistring2 libxml2 procps sudo tar zlib1g
RUN /build/bitnami-user.sh
RUN /build/install-nami.sh
RUN bitnami-pkg install java-1.8.292-0 --checksum 700e2d8391934048faefb45b4c3a2af74bc7b85d4c4e0e9a24164d7256456ca2
RUN bitnami-pkg unpack tomcat-9.0.50-1 --checksum bc4e075aa8aa539805759117062f5fee126232bdab45743e83b39c35a8a6a2bf
RUN bitnami-pkg unpack mysql-client-10.3.30-0 --checksum 47107f86621bb184307e47bbb15244d076575f0e0f7d339f198ef312b6f3f285
RUN bitnami-pkg unpack postgresql-client-13.3.0-0 --checksum 1202c736e3c5b28de1dd1deb05eb2d68bd7ebccc54c9ed1eab05220f346456c3
RUN bitnami-pkg install git-2.32.0-0 --checksum 3094f50c904e966bd6c6a2d6152cf41fd3a816d32395622a785ccbcda62b7c5f
RUN bitnami-pkg install tini-0.19.0-1 --checksum 9b1f1c095944bac88a62c1b63f3bff1bb123aa7ccd371c908c0e5b41cec2528d
RUN bitnami-pkg unpack jasperreports-7.8.0-6 --checksum f5a83bb36ca4cc0d7af9a99555dfc96c2f0dc308d58a1ba29416194c72d29911
RUN bitnami-pkg install gosu-1.13.0-0 --checksum fd7257c2736164d02832dbf72e2c1ed9d875bf3e32f0988520796bc503330129

COPY rootfs /
COPY nami/ /root/.nami/components/

ENV ALLOW_EMPTY_PASSWORD="no" \
    BITNAMI_APP_NAME="jasperreports" \
    BITNAMI_IMAGE_VERSION="7.8.0-debian-10-r266" \
    JASPERREPORTS_DATABASE_NAME="bitnami_jasperreports" \
    JASPERREPORTS_DATABASE_PASSWORD="" \
    JASPERREPORTS_DATABASE_USER="bn_jasperreports" \
    JASPERREPORTS_EMAIL="user@example.com" \
    JASPERREPORTS_PASSWORD="bitnami" \
    JASPERREPORTS_USERNAME="user" \
    DB_TYPE="" \
    DB_HOST="mariadb" \
    DB_PORT_NUMBER="3306" \
    DB_ROOT_PASSWORD="" \
    DB_ROOT_USER="root" \
    DB_CLIENT_CREATE_DATABASE_NAME="" \
    DB_CLIENT_CREATE_DATABASE_PASSWORD="" \
    DB_CLIENT_CREATE_DATABASE_PRIVILEGES="ALL" \
    DB_CLIENT_CREATE_DATABASE_USER="" \
    DB_CLIENT_ENABLE_SSL="no" \
    DB_CLIENT_SSL_CA_FILE="" \
    OS_ARCH="amd64" \
    OS_FLAVOUR="debian-10" \
    OS_NAME="linux" \
    SMTP_EMAIL="" \
    SMTP_HOST="" \
    SMTP_PASSWORD="" \
    SMTP_PORT="" \
    SMTP_PROTOCOL="" \
    SMTP_USER=""

EXPOSE 8080 8443

ENTRYPOINT [ "/app-entrypoint.sh" ]
CMD [ "nami", "start", "--foreground", "tomcat" ]
