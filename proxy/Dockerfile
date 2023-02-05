FROM python:3.10-slim AS builder
WORKDIR /var/ursus
RUN pip install --upgrade --no-cache-dir ursus@https://github.com/nicbou/ursus/archive/master.zip
COPY ursus/ /var/ursus
RUN mkdir -p /var/ursus/output && ursus -c ursus_config.py

FROM nginx:mainline-alpine
RUN apk add --no-cache openssl && rm -rf /tmp/packages

# Regular stuff
COPY proxy/nginx/configs/* /etc/nginx/configs/
COPY proxy/nginx/nginx.conf /etc/nginx/nginx.conf

# Let's encrypt stuff
ARG SSL_DOMAIN
ARG SSL_EMAIL
ENV SSL_DOMAIN=${SSL_DOMAIN}
ENV SSL_EMAIL=${SSL_EMAIL}

COPY proxy/scripts/start.sh ./start.sh
COPY proxy/scripts/reinstall-ssl-cert.sh /etc/periodic/hourly/reinstall-ssl-cert
RUN curl https://get.acme.sh | sh -s email=$SSL_EMAIL

COPY --from=builder /var/ursus/output /var/www/html

ENTRYPOINT ./start.sh
