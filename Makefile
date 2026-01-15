include makefiles/*.mk

.DEFAULT_GOAL := help

# Output color
RESETC         = "\033[0m"
YELLOWC        = "\033[33m"
GREENC         = "\033[32m"
BOLDC          = "\033[1m"
BLUEC          = "\033[34m"

COLOR_TARGET   = $(BOLDC)
COLOR_CATEGORY = $(BLUEC)
COLOR_HEADER   = $(BOLDC)


.PHONY: help
help: ## Print Help (this message) and exit.
	@awk                                                                                  \
		-v resetc=$(RESETC)                                                                 \
		-v targetc=$(COLOR_TARGET)                                                          \
		-v categoryc=$(COLOR_CATEGORY)                                                      \
		-v boldc=$(COLOR_HEADER)                                                            \
		'BEGIN {                                                                            \
			FS       = ":.*##";                                                               \
			category = "";                                                                    \
			print boldc, "Usage: make [TARGRT]", resetc;                                      \
			print                                                                             \
		}                                                                                   \
		/^##@/ {                                                                            \
			category = substr($$0, 5);                                                        \
			print "";                                                                         \
			print categoryc, category, resetc;                                                \
			next                                                                              \
		}                                                                                   \
		/^[^:[:space:]]+:.*?##/ {                                                           \
			print "    ", targetc, sprintf("%-20s", $$1), resetc, $$2;                        \
			documented[$$1] = 1;                                                              \
			next                                                                              \
		}                                                                                   \
		/^[^:[:space:]]+:/ {                                                                \
			target = $$1;                                                                     \
			sub(/:.*/, "", target);                                                           \
			if (!documented[target] && target !~ /^\./) {                                     \
				todo[target] = 1                                                                \
			}                                                                                 \
		}                                                                                   \
		END {                                                                               \
			if (length(todo) > 0) {                                                           \
				  print "";                                                                     \
				  print categoryc, "TODO: Undocumented Targets", resetc;                        \
				  for (t in todo) {                                                             \
				  print "    ", targetc, sprintf("%-20s", t), resetc                            \
				}                                                                               \
			}                                                                                 \
		}' $(MAKEFILE_LIST)
