FROM python:3.12-slim

WORKDIR /app

# System dependencies for psycopg2 + cryptography
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

EXPOSE 8000

# Default: production server (docker-compose overrides with --reload for dev).
# Honors $PORT when set (Railway sets this dynamically); falls back to 8000 locally.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
