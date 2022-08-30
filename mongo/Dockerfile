FROM mongo:4.4
RUN mkdir /var/lib/mongodb
RUN mkdir /etc/mongo
RUN chown -R mongodb:mongodb /var/lib/mongodb
RUN chown -R mongodb:mongodb /data
RUN chown -R mongodb:mongodb /etc/mongo
# Instalamos libreria cron
RUN apt-get update
RUN apt-get -y install cron
RUN crontab -l | { cat; echo "25 14 * * * bash /data/sh/clean_db.sh"; } | crontab -

