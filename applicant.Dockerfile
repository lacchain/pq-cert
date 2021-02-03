FROM node:12.9 as front
WORKDIR /app
COPY ./app/applicant/front ./
RUN npm i -g yarn
RUN yarn install
RUN yarn build

FROM node:12.9 as back
WORKDIR /app
COPY ./app/applicant/back ./
RUN npm install

FROM debian:testing-slim as base

RUN apt-get update && apt-get install --no-install-recommends -yV \
    dpkg-dev \
    wget \
    ca-certificates

RUN mkdir /debs/
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/liboqs-debian/releases/download/0.4.0/liboqs-dev_0.4.0_amd64.deb
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/liboqs-debian/releases/download/0.4.0/liboqs_0.4.0_amd64.deb
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/liboqs-debian/releases/download/0.4.0/SHA256SUMS
RUN curl -sL https://deb.nodesource.com/setup_12.4 | bash -
RUN cd /debs/ && sha256sum --check --ignore-missing --status SHA256SUMS && dpkg-scanpackages . /dev/null | gzip -9c > Packages.gz
RUN echo "deb [trusted=yes] file:/debs ./" >> /etc/apt/sources.list

FROM base as nodejs

RUN apt-get update && apt-get install --no-install-recommends -yV \
    openssl \
    nodejs \
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
COPY ./config/ibrand.conf /ibrand.cnf
COPY ./config/setup.sh /setup.sh

RUN wget --directory-prefix=/debs/ https://github.com/lacchain/openssl-pqe-engine/releases/download/v0.1.0/openssl-pqe-engine_0.1.0_amd64.deb
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/pq-cert/releases/download/1/libssl1.1_1.1.1g-1+oqs_amd64.deb
RUN wget --directory-prefix=/debs/ https://github.com/lacchain/pq-cert/releases/download/1/openssl_1.1.1g-1+oqs_amd64.deb

RUN dpkg -i ./debs/openssl-pqe-engine_0.1.0_amd64.deb

RUN dpkg -i /debs/libssl1.1_1.1.1g-1+oqs_amd64.deb
RUN dpkg -i /debs/openssl_1.1.1g-1+oqs_amd64.deb

FROM nodejs as runner
RUN mkdir /app
COPY --from=back /app ./app
COPY --from=front /app/build ./app/public/
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
#curl --http1.1 --silent --fail --show-error --cert /certs/client.crt --key /certs/client.key --header "Content-Type: application/json" --data-raw "{\"clientCertName\":\"monarca.iadb.org\", \"clientCertSerialNumber\":\"$certSerial\", \"countryCode\":\"GB\", \"channels\":[{\"type\":\"sms\", \"value\":\"10000000001\\"}, {\"type\":\"email\", \"value\":\"diegol@iadb.org\"}], \"kemAlgorithm\":\"222\"}" https://pqe-rpc-server/api/clientsetupdata -o /oob/ironbridge_clientsetup_OOB_1.json\n\
#tail -f /var/log/syslog\n\
#sleep 15\n\
export OPENSSL_CONF=/usr/lib/ssl/ibrand_openssl.cnf\n\
export IBRAND_CONF=/ibrand.cnf\n\
nodejs --experimental-modules /app/app.js\n'\
>> /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
