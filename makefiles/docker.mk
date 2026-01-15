##@ Docker containers management (local development):

DCOMPOSE = docker compose -f dockercompose.dev.local.yml

RED := \033[31m
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
RESET := \033[0m

DJANGO_APP_CONTAINER = django-app
DJANGO_SETTINGS_MODULE = config.settings.dev

# containers management
up: ## runs docker compose up
	$(DCOMPOSE) --verbose  up -d --remove-orphans

build-up: build up ## builds and runs docker compose up

build: ## builds docker compose services
	$(DCOMPOSE) --verbose  build --pull --no-cache

down: ## runs docker compose down
	$(DCOMPOSE) down

stop: ## stops docker compose services
	$(DCOMPOSE) stop

restart: ## restarts docker compose services
	$(DCOMPOSE) restart

logs: ## tails docker compose logs
	$(DCOMPOSE) logs -f

ps: ## lists docker compose services
	$(DCOMPOSE) ps

shell: ## opens a shell in the django-app container
	@docker exec -it $(DJANGO_APP_CONTAINER) bash

clean: down sclean ## cleans docker compose services
	#$(DCOMPOSE) rm -f

# sclean: rm-pyc rm-migrations

fclean: clean sclean ## force cleans docker compose services
	docker system prune -af

purge: ## purges all docker data (containers, images, volumes, networks)
	@echo "${YELLOW}Are you sure you want to purge all data? [y/N]${RESET} "
	@read confirm;                                                                \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then                       \
		echo "${YELLOW}Purging all data...${RESET}";                                \
		docker stop $$(docker ps -aq) &&                                            \
		docker system prune -af       &&                                            \
		docker builder prune -af      &&                                            \
		echo "${GREEN}All data purged successfully!${RESET}";                       \
	else                                                                          \
		echo "${RED}Purge cancelled.${RESET}";                                      \
	fi

re: clean up

# project management
db-flush: ## flushes the database in the django-app container
	@echo "${YELLOW}Flushing the database...${RESET}"
	$(DCOMPOSE) exec $(DJANGO_APP_CONTAINER) python /app/api/manage.py flush --no-input --settings=$(DJANGO_SETTINGS_MODULE)

db-migrate: ## creates and applies migrations in the django-app container
	@echo "${YELLOW}Creating migrations...${RESET}"
	$(DCOMPOSE) exec $(DJANGO_APP_CONTAINER) python /app/api/manage.py makemigrations
	echo "${YELLOW}Applying migrations...${RESET}"
	$(DCOMPOSE) exec $(DJANGO_APP_CONTAINER) python /app/api/manage.py migrate

num ?= 10
email ?= $(shell bash -c 'export LC_ALL=C; tr -dc "a-z0-9" < /dev/urandom | head -c 8')@example.com
password ?= "123aga123"

superuser: ## creates a superuser in the django-app container
	@echo "${YELLOW}Creating superuser with${RESET} \
	${BLUE}email${RESET}: $(email), \
	${BLUE}password${RESET}: $(password)"

	@$(DCOMPOSE) exec $(DJANGO_APP_CONTAINER) python /app/api/manage.py createadmin --email=$(email) --password=$(password)

dshell: ## opens a django shell in the django-app container
	@echo "${YELLOW}Opening a django shell in the django-app container...${RESET}"
	$(DCOMPOSE) exec $(DJANGO_APP_CONTAINER) python /app/api/manage.py shell

# attach vscode to api container
code: ## opens VSCode attached to the django-app container
	code --folder-uri "vscode-remote://attached-container+$$(printf api | xxd -ps | tr -d '\n')/app/api"

.PHONY: build up down stop restart logs ps shell clean fclean re build-up
