FROM debian:testing-slim as base

RUN apt-get update && apt-get install --no-install-recommends -yV \
    dpkg-dev \
    wget \
    ca-certificates

RUN mkdir /debs/
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/liboqs-debian/releases/download/0.4.0/liboqs-dev_0.4.0_amd64.deb
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/liboqs-debian/releases/download/0.4.0/liboqs_0.4.0_amd64.deb
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/liboqs-debian/releases/download/0.4.0/SHA256SUMS
RUN cd /debs/ && sha256sum --check --ignore-missing --status SHA256SUMS && dpkg-scanpackages . /dev/null | gzip -9c > Packages.gz
RUN echo "deb [trusted=yes] file:/debs ./" >> /etc/apt/sources.list

FROM base as runner

ENV SERVER_HOST=ironbridgeapi.com
ENV SUBJECT="/C=US/ST=CA/O=IADB/CN=iadb.org"

RUN apt-get update && apt-get install --no-install-recommends -yV \
    openssl \
    ca-certificates \
    libcurl4 \
    rsyslog \
    curl \
    jq \
    wait-for-it \
    file \
    liboqs \
 && rm -rf /var/lib/apt/lists/*

COPY ./config/ibrand_openssl.cnf /usr/lib/ssl/
COPY ./config/demo_openssl.cnf /usr/lib/ssl/
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/openssl-pqe-engine/releases/download/v0.1.0/openssl-pqe-engine_0.1.0_amd64.deb

RUN wget --directory-prefix=/debs/ https://github.com/lacchain/pq-cert/releases/download/1/libssl1.1_1.1.1g-1+oqs_amd64.deb
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/pq-cert/releases/download/1/openssl_1.1.1g-1+oqs_amd64.deb

RUN dpkg -i ./debs/openssl-pqe-engine_0.1.0_amd64.deb
RUN dpkg -i /debs/libssl1.1_1.1.1g-1+oqs_amd64.deb
RUN dpkg -i /debs/openssl_1.1.1g-1+oqs_amd64.deb
RUN sed -i '/imklog/s/^/#/' /etc/rsyslog.conf
RUN mkdir -p /var/lib/ibrand/
RUN echo '#!/bin/sh\n\
set -x\n\
service rsyslog start\n\
cp /ca-certs/root.crt /usr/local/share/ca-certificates/\n\
update-ca-certificates -v\n\
export OPENSSL_CONF=/usr/lib/ssl/ibrand_openssl.cnf\n\
openssl req -x509 -nodes -days 365 -newkey falcon512 -keyout /out/ca.key -out /out/ca.crt -config /usr/lib/ssl/demo_openssl.cnf -subj $SUBJECT\n\
'\
>> /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
