FROM node:lts-buster-slim as front
WORKDIR /app
COPY ./app/applicant/front ./
RUN yarn install
RUN yarn build

FROM node:lts-buster-slim as back
WORKDIR /app
COPY ./app/applicant/back ./
RUN npm install

FROM node:lts-buster-slim as base

RUN apt-get update && apt-get install --no-install-recommends -yV \
    dpkg-dev \
    wget \
    ca-certificates

RUN mkdir /debs/
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/liboqs-debian/releases/download/0.4.0/liboqs-dev_0.4.0_amd64.deb
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/liboqs-debian/releases/download/0.4.0/liboqs_0.4.0_amd64.deb
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/liboqs-debian/releases/download/0.4.0/SHA256SUMS
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/openssl-pqe-engine/releases/download/v0.1.0/openssl-pqe-engine_0.1.0_amd64.deb
RUN wget https://github.com/lacchain/openssl-pqe-engine/releases/download/v0.1.0/SHA256SUMS -O ->> /debs/SHA256SUMS
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/oqs-openssl-debian/releases/download/OQS-OpenSSL_1_1_1-stable-snapshot-2020-07/libssl1.1_1.1.1g-1+oqs-2020-07_amd64.deb
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/oqs-openssl-debian/releases/download/OQS-OpenSSL_1_1_1-stable-snapshot-2020-07/openssl_1.1.1g-1+oqs-2020-07_amd64.deb
RUN wget https://github.com/lacchain/oqs-openssl-debian/releases/download/OQS-OpenSSL_1_1_1-stable-snapshot-2020-07/SHA256SUMS -O ->> /debs/SHA256SUMS
RUN cd /debs/ && sha256sum --check --ignore-missing --status SHA256SUMS && dpkg-scanpackages . /dev/null | gzip -9c > Packages.gz
RUN echo "deb [trusted=yes] file:/debs ./" >> /etc/apt/sources.list

FROM base as runner

RUN apt-get update && apt-get install --no-install-recommends -yV \
    openssl=1.1.1g-1+oqs-2020-07 \
    openssl-pqe-engine \
    libcurl4 \
    curl \
    jq \
    wait-for-it \
    file \
    rsyslog \
 && rm -rf /var/lib/apt/lists/*

RUN mkdir /app
COPY --from=back /app ./app
COPY --from=front /app/build ./app/public/

COPY ./config/ibrand_openssl.cnf /usr/lib/ssl/
COPY ./config/demo_openssl.cnf /usr/lib/ssl/
COPY ./config/ibrand.conf /ibrand.cnf
COPY ./config/setup.sh /setup.sh

RUN sed -i '/imklog/s/^/#/' /etc/rsyslog.conf

RUN mkdir -p /var/lib/ibrand/
RUN mkdir /certs/
RUN mkdir /oob/
RUN echo '#!/bin/sh\n\
set -x\n\
service rsyslog start\n\
cp /ca-certs/root.crt /usr/local/share/ca-certificates/\n\
update-ca-certificates -v\n\
openssl genrsa -out /certs/client.key 2048\n\
openssl req -new -sha512 -key /certs/client.key -subj "/C=US/ST=CA/O=IADB/CN=client" -out /certs/client.csr\n\
openssl x509 -req -in /certs/client.csr -CA /ca-certs/root.crt -CAkey /ca-certs/root.key -CAcreateserial -out /certs/client.crt -days 500 -sha512\n\
certSerial=$(openssl x509 -noout -serial -in /certs/client.crt | cut -d'\''='\'' -f2)\n\
export OPENSSL_CONF=/usr/lib/ssl/ibrand_openssl.cnf\n\
export IBRAND_CONF=/ibrand.cnf\n\
nodejs --experimental-modules /app/app.js\n'\
>> /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
