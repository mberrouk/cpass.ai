##@ Django project management

.PHONY: rm-pyc
rm-pyc: ## removes all .pyc files and __pycache__ directories
	@echo "${YELLOW}Removing .pyc files...${RESET}"
	@find . -path '*/__pycache__/*' -delete -print
	@echo "${YELLOW}Removing __pycache__ directories...${RESET}"
	@find . -name '__pycache__' -delete -print

.PHONY: rm-migrations
rm-migrations: ## removes all migration files and the database file
	@echo "${YELLOW}Removing migrations...${RESET}"
	@find . -path '*/migrations/*.py' -not -name '__init__.py' -delete -print

	@echo "${YELLOW}Removing database file (db.qlite3)...${RESET}"
	@find . -path '*/db.*' -delete
