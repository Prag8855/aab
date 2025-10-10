FROM nginx:mainline-alpine
RUN apk add --no-cache openssl inotify-tools && rm -rf /tmp/packages

# Regular stuff
COPY nginx/ /etc/nginx/

# Let's encrypt stuff
ARG SSL_DOMAIN
ARG SSL_EMAIL
ENV SSL_DOMAIN=${SSL_DOMAIN}
ENV SSL_EMAIL=${SSL_EMAIL}

COPY start.sh ./start.sh
COPY reinstall-ssl-cert.sh /etc/periodic/hourly/reinstall-ssl-cert
RUN curl https://get.acme.sh | sh -s email=$SSL_EMAIL

ENTRYPOINT ["./start.sh"]
