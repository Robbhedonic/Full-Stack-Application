#!/bin/sh
set -e

echo "Starting PetCare API..."
node src/server.js &
APP_PID=$!

if [ -z "$DATABASE_URL" ]; then
  echo ""
  echo "=============================================="
  echo "ERROR: DATABASE_URL is not set."
  echo ""
  echo "Railway fix:"
  echo "  1. Project → + New → Database → PostgreSQL"
  echo "  2. Web service → Variables → Add reference → DATABASE_URL"
  echo "  3. Redeploy"
  echo "=============================================="
  echo ""
  wait "$APP_PID"
  exit 0
fi

echo "Running migrations..."
TRIES=0
MAX_TRIES=30
until npx prisma migrate deploy; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -ge "$MAX_TRIES" ]; then
    echo "ERROR: prisma migrate deploy failed after ${MAX_TRIES} attempts."
    echo "Check DATABASE_URL is linked to the Postgres service."
    kill "$APP_PID" 2>/dev/null || true
    exit 1
  fi
  echo "Migration attempt ${TRIES}/${MAX_TRIES} failed, retrying in 5s..."
  sleep 5
done

echo "Seeding database..."
npx prisma db seed

echo "PetCare is ready."
wait "$APP_PID"
