#!/usr/bin/env bash

set -xe

LISTENINGADDR='0.0.0.0:8000'
MANAGE='/app/manage.py'
SETTINGS=--settings=config.settings.dev

python manage.py collectstatic --noinput $SETTINGS
python $MANAGE makemigrations $SETTINGS
python $MANAGE migrate $SETTINGS

python $MANAGE runbot $SETTINGS &
python $MANAGE runserver 0.0.0.0:8000 $SETTINGS &

wait -n
exit $?
