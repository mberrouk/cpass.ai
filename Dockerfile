FROM python:3.13-slim AS builder

RUN mkdir /app
WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

COPY requirements.txt  /app
COPY ./django-project  /app
COPY ./entrypoint.sh   /app

RUN pip install --upgrade pip && \
  pip install --no-cache-dir -r requirements.txt


RUN mkdir -p /app/staticfiles /app/mediafiles

# FROM builder AS dev


# FROM python:3.13-slim
# RUN useradd -m -r appuser && \
#   mkdir /app && \
#   chown -R appuser /app
#
# COPY --from=builder /usr/local/bin/python3.13/site-packages/ /usr/local/lib/python3.13/site-packages/
# COPY --from=builder /usr/local/bin/ /usr/local/bin/
#
# WORKDIR /app
#
#
# COPY --chown=appuser:appuser ./entrypoint.sh .
# COPY --chown=appuser:appuser ./django-project/ .
#
# ENV PYTHONDONTWRITEBYTECODE=1
# ENV PYTHONUNBUFFERED=1
#
# USER appuser
#
# RUN chmod 744 entrypoint.sh
EXPOSE 8000
#
# CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "my_docker_django_app.wsgi:application"]
CMD ["bash", "entrypoint.sh"]
