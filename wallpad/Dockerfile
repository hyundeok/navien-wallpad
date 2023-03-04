FROM ubuntu:20.04
ENV LANG C.UTF-8

RUN apt-get update
RUN apt-get -y upgrade
RUN apt-get -y install curl
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get -y install nodejs
RUN apt-get -y install build-essential udev

RUN mkdir -p /app/js
COPY run.sh /app/
COPY js /app/js
COPY config.json /app/

WORKDIR /app

RUN npm init -f
RUN npm install mqtt
RUN npm install serialport --build-from-source=serialport

RUN chmod a+x /app/run.sh
CMD [ "/app/run.sh" ]

