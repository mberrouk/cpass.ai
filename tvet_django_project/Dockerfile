FROM python:3.13-slim AS builder

RUN mkdir /app
WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

COPY requirements.txt  /app

RUN pip install --upgrade pip && \
  pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /app/staticfiles /app/mediafiles

EXPOSE 8001
#
CMD ["bash", "entrypoint.dev.sh"]