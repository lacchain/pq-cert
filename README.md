# Introduction

LACChain DNS is a Decentralized Name Service that helps to maintain a registry of verified entities through a set of certificates issued by Certification Authorities (CA) associated with a DID (ethr). 
Certificates will be used to register and validate the entity in an Ethereum Smart contract, which we called: **DNSRegistry**.

# DID Issuance
In order to register a DID in the DNS service, it must be generated from a valid X.509 certificate. The steps for the generation of the certificates are described in the section below.

![DID Issuance](doc/did_issuance.png?raw=true "DID Issuance Diagram") 

In the previous diagram it is possible to see the process for the issuance of a DID through a certifying authority, 
making use of different X.509 certificates validated by a root CA. 
The applicant must previously have a valid certificate (usually SSL), and a set of Ethereum keys in order to generate a Certificate Signing Request (CSR). 
Optionally, you can add a Post-Quantum key pair in the certificate request. 
As a final step, the certificate issued will have embedded both: the certificate data (SSL), as well as the Ethereum and Post-Quantum keys (if applicable)

In the following diagram the certification process and DID issuance using Ethereum Key Pair is show.
![DID Issuance](doc/pq-cert-ethereum.png?raw=true "Certification using Ethereum KeyPair")

The next diagram shows the same process as above, but extending the certification process with a Post-Quantum Keys Generated.
![DID Issuance](doc/pq-cert-quantum.png?raw=true "Certification using Ethereum KeyPair and Post-Quantum Keys") 

## Generate Certificates

In order to validate the data of the entity to be registered in the DNS, it is necessary to have a valid X.509 certificate issued by a certifying entity (CA). Likewise, it is necessary to generate a request signing certificate (CSR) with the ethereum keys to send to the Post-Quantum Certification Authority and a certificate is generated under the hierarchy of said root CA.

Optionally, an X.509 v3 certificate with Post-Quantum keys can be generated to add these keys as attributes in the CSR that will be sent to the Post-Quantum Certificate Authority.

### 1. Ethereum-based Certificate Request (CSR)
Ethereum keys are based on the secp256k1 elliptical curve algorithm. 
It is possible to generate a Certificate Signing Request (CSR) using the key pair of an Ethereum account, 
but for this it is necessary to specify the details using the Abstract Syntax Notation One (ASN1).

```
asn1 = SEQUENCE:seq_section
 
[seq_section]
version    = INTEGER:01
privateKey = FORMAT:HEX,OCT:<ethereum private key hex>
parameters = EXPLICIT:0,OID:secp256k1
publicKey  = EXPLICIT:1,FORMAT:HEX,BITSTR:04<ethereum public key hex>
```

Finally, the CSR can be built with the following openssl commands with an intermediate step over a DER format key expressed in the ASN.1 file.

```
> openssl asn1parse -noout -genconf ethereum.asn1 -out eth_private_key.der 
> openssl ec -inform DER -in eth_private_key.der -out eth_private_key.pem 
> openssl req -new -key eth_private_key.pem -days 365 -out eth_certificate_request.csr
```

There is also an alternative way using docker-compose. To generate the ethereum CSR, you need to edit the ``PRIVATE_KEY`` and ``PUBLIC_KEY`` variables in the docker-compose.yml,
once you have settled that variables, just execute the following commands:

```shell
$ docker-compose run ethereum
```

**Note:** Don't forget to change the ``SUBJECT`` environment variable in the docker-compose.yml file. This variable will be passed to the openssl command, refer to [E24191](https://docs.oracle.com/cd/E24191_01/common/tutorials/authz_cert_attributes.html) to see the subject format and fields.

### 2. Post-Quantum CSR

In order to generate the Post-Quantum certificate it is necessary to have the openssl custom library installed. 
However there is a dockerfile available in the /generator directory, which have the container with the custom openssl
to generate post-quantum certificates.

To deploy the docker container, you need to execute the following commands:

```shell
$ docker-compose run quantum
```

**Note:** Don't forget to change the ``SUBJECT`` environment variable in the docker-compose.yml file. This variable will be passed to the openssl command, refer to [E24191](https://docs.oracle.com/cd/E24191_01/common/tutorials/authz_cert_attributes.html) to see the subject format and fields.

The previous command will generate a new post-quantum CSR (using Dilithium2 algorithm) in the /out directory, with their respective private key.  

## 3. Certificate Generation

The process to generate the certificate, is as follows:
1. The Post-Quantum CA verifies the subject of Applicant Certificate, Ethereum CSR and Post-Quantum CSR to be equal.
2. Generate Certificate with Applicant Certificate subject, Post-Quantum Public Key and Ethereum Public Key as x.509 v3 attribute.

The process described above can be performed with the following docker-compose command:

```bash
$ docker-compose run generator
```

Don't forget to mount the volumes corresponding to the root CA certificate rootCA and applicant CRT in the docker-compose.yml file.

```
volumes:
    - <Applicant Certificate>:/main.crt
    - <Root CA Private Key>:/root_ca.key
    - <Root CA Certificate>:/root_ca.crt
```

## 4. DID Issuance

The process to issue a DID, is as follows:

1. Generate a DID with a temporary Ethereum KeyPair
2. Add the Post-Quantum Public Key to the DID
3. Change the owner of the DID to Ethereum address from Ethereum CSR
4. Delete temporary Ethereum KeyPair

```bash
$ docker-compose run did
```

Before to execute the **```did```** docker command, you must edit the environment variables in the docker-compose.yml file.

```
- ETHR_REGISTRY: "<EthrRegistry Contract Address>"
- WEB3_RPC: <Ethereum RPC http url>
- CERTIFICATE: <Certificate File Name>
- NETWORK_ID: <Ethereum Network ID>
```

Finally, make sure that your certificate (CRT) generated in the previous step is mounted in the volumes section.
``` 
volumes:
  - ./out/certificate.crt:/app/<Certificate File Name>
```

## Copyright 2020 LACChain

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.