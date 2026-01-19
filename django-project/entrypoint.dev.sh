
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

# Export demo institutions with API keys to shared JSON
SHARED_JSON='/shared/.demo_institutions.json'

python $MANAGE seed_demo_institutions \
--with-workers \
--output-json "$SHARED_JSON" $SETTINGS

python $MANAGE runbot $SETTINGS &
python $MANAGE runserver $LISTENINGADDR $SETTINGS &

wait -n
exit $?
