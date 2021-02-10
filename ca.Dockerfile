FROM node:lts-buster-slim as front
WORKDIR /app
COPY ./app/ca/front ./
RUN yarn install
RUN yarn build

FROM node:lts-buster-slim as back
WORKDIR /app
COPY ./app/ca/back ./
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
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/oqs-openssl-debian/releases/download/OQS-OpenSSL_1_1_1-stable-snapshot-2020-07/libssl1.1_1.1.1g-1+oqs-2020-07_amd64.deb
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/oqs-openssl-debian/releases/download/OQS-OpenSSL_1_1_1-stable-snapshot-2020-07/openssl_1.1.1g-1+oqs-2020-07_amd64.deb
RUN wget https://github.com/lacchain/oqs-openssl-debian/releases/download/OQS-OpenSSL_1_1_1-stable-snapshot-2020-07/SHA256SUMS -O ->> /debs/SHA256SUMS
RUN cd /debs/ && sha256sum --check --ignore-missing --status SHA256SUMS && dpkg-scanpackages . /dev/null | gzip -9c > Packages.gz
RUN echo "deb [trusted=yes] file:/debs ./" >> /etc/apt/sources.list

FROM base as runner

RUN apt-get update && apt-get install --no-install-recommends -yV \
    openssl=1.1.1g-1+oqs-2020-07 \
 && rm -rf /var/lib/apt/lists/*

RUN mkdir /app
COPY --from=back /app ./app
COPY --from=front /app/build ./app/public/

RUN echo '#!/bin/sh\n\
set -x\n\
nodejs --experimental-modules --experimental-json-modules /app/app.js\n'\
>> /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
