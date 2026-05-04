FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY pipeline/requirements.txt /app/pipeline/requirements.txt
RUN pip install -r /app/pipeline/requirements.txt

COPY pipeline /app/pipeline
COPY run.sh /app/run.sh
RUN chmod +x /app/run.sh

# Persist the SQLite DB and feed checkpoints across container restarts.
VOLUME ["/app/pipeline/data"]

ENTRYPOINT ["/app/run.sh"]
CMD ["daily"]
