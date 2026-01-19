#!/usr/bin/env bash

set -xe

LISTENINGADDR='0.0.0.0:8001'
MANAGE='/app/manage.py'

python $MANAGE collectstatic --noinput
python $MANAGE makemigrations
python $MANAGE migrate

# Sleep to ensure CPASS is ready
sleep 5
# Seed initial data
SHARED_JSON='/shared/.demo_institutions.json'
python $MANAGE seed_demo_data --from-json $SHARED_JSON --with-candidates

python $MANAGE runserver $LISTENINGADDR #TODO: switch to gunicorn