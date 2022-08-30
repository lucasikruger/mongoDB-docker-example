#!/bin/bash
set -x
# The number between parentesis is the number of days ( in this case is 90 days)
declare -i time_now=`date +%s`;
declare time_now_file=`date -d @$time_now "+%Y-%m-%dt%H.%M"`;
mongo -u admin -p secret --authenticationDatabase admin --eval 'db.testing.deleteMany({'date' : {$lt : new Date((new Date().getTime() - ( (90) *24 * 60 * 60 * 1000)))}});' test > "./cleans/clean_${time_now_file}.log"
