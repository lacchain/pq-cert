subject_main=$(openssl x509 -noout -in main.csr -subject | sed 's/subject=//')
subject_ethereum=$(openssl req -noout -in out/ethereum_request.csr -subject | sed 's/subject=//')
subject_quantum=$(openssl req -noout -in out/quantum_request.csr -subject | sed 's/subject=//')
if [ "$subject_ethereum" != "$subject_quantum" ] && [ "$subject_ethereum" != "$subject_main" ]; then
  echo "The main CRT, ethereum CSR and quantum CSR must have the same subject"
  exit 1
fi
ethereum_key=$(openssl req -noout -in /out/ethereum_request.csr -pubkey | openssl pkey -inform PEM -pubin -text -noout | grep pub -A 5 | tail -n +2 | tr -d '\n[:space:]:' | sed 's/^04//')
echo "[v3_req]\n1.2.3.4.5.6.7.8=ASN1:UTF8String:${ethereum_key}" > openssl.conf
openssl x509 -req -in /out/quantum_request.csr -CA root_ca.crt -CAkey root_ca.key -CAcreateserial -days 500 -sha256 -extfile openssl.conf -extensions v3_req >/out/certificate.crt