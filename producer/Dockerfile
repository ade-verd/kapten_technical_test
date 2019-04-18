FROM node:10.15

ENV AMQP_URL amqp://guest:guest@rabbitmq:5672
ENV N 10
ENV TIC 1000

#ENV N 10
#ENV TIC 100

ADD . /code
WORKDIR /code
RUN npm install --production
CMD ["npm", "start"]
