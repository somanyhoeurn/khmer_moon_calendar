#!/bin/sh
# Runs once when the PostgreSQL volume is first created.
# Calendar dates are interpreted in Cambodia; timestamps are stored as timestamptz.
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
ALTER DATABASE "$POSTGRES_DB" SET timezone TO 'Asia/Phnom_Penh';
SQL
