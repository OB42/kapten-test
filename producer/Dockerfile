FROM node:8.5

ENV AMQP_URL amqp://guest:guest@rabbitmq:5672
ENV N 1500
ENV TIC 1000

ADD . /code
WORKDIR /code
RUN npm install --production
CMD ["npm", "start"]
