FROM alpine:3

ENV APP_ENV=production

RUN apk add --no-cache --update nginx nodejs npm supervisor \
    && mkdir -p /run/nginx \
    && mkdir /www \
    && mkdir /etc/supervisor.d

WORKDIR /www

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY src src
COPY supervisor.conf /etc/supervisor.d/default.ini

CMD ["supervisord", "-c", "/etc/supervisord.conf"]