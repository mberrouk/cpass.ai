#!/usr/bin/env bash

set -xe

LISTENINGADDR='0.0.0.0:8000'
MANAGE='/app/manage.py'
SETTINGS=--settings=config.settings.dev

python $MANAGE collectstatic --noinput $SETTINGS
python $MANAGE makemigrations $SETTINGS
python $MANAGE migrate $SETTINGS

# Seed initial data
python $MANAGE seed_categories_jobs $SETTINGS
# TODO: Seed demo data for demo profiles and institutions

python $MANAGE runbot $SETTINGS &
python $MANAGE runserver 0.0.0.0:8000 $SETTINGS &

wait -n
exit $?
