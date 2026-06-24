# Restore A TopoPass Postgres Backup

Use this runbook for a controlled restore drill or emergency restore. Do not
restore over production without a current incident plan and a recent backup of
the current state.

Backups created by `backup-postgres.sh` use `pg_dump -Fc`, so restore with
`pg_restore`.

## 1. List Backups

```bash
BACKUP_S3_BUCKET=your-topopass-backup-bucket
BACKUP_S3_PREFIX=topopass

aws s3 ls "s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/postgres/" --recursive
```

Pick the backup key to restore.

## 2. Download The Backup

```bash
RESTORE_KEY=topopass/postgres/YYYY/MM/topopass-postgres-YYYYMMDDTHHMMSSZ.dump
mkdir -p /srv/topopass-data/backups/restore
aws s3 cp "s3://$BACKUP_S3_BUCKET/$RESTORE_KEY" /srv/topopass-data/backups/restore/restore.dump
test -s /srv/topopass-data/backups/restore/restore.dump
```

## 3. Stop Application Writes

Stop app containers that can write to the database before restoring.

```bash
cd /srv/topopass
docker compose -f deploy/docker-compose.prod.yml stop app
```

If the Supabase stack uses a separate Compose file, stop API/auth/realtime
services that can write to Postgres, but keep the Postgres container running for
the restore.

## 4. Restore Into Postgres

Set host-only values without printing secrets:

```bash
POSTGRES_CONTAINER_NAME=supabase-db
POSTGRES_DB=postgres
POSTGRES_USER=postgres
```

Copy the dump into the Postgres container:

```bash
docker cp /srv/topopass-data/backups/restore/restore.dump "$POSTGRES_CONTAINER_NAME:/tmp/topopass-restore.dump"
```

Restore into a fresh database when possible:

```bash
docker exec "$POSTGRES_CONTAINER_NAME" createdb -U "$POSTGRES_USER" topopass_restore
docker exec "$POSTGRES_CONTAINER_NAME" pg_restore \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  -U "$POSTGRES_USER" \
  -d topopass_restore \
  /tmp/topopass-restore.dump
```

For an emergency production restore, confirm the exact target database and
maintenance window before restoring into the live database.

## 5. Verify The Restore

Examples:

```bash
docker exec "$POSTGRES_CONTAINER_NAME" psql -U "$POSTGRES_USER" -d topopass_restore -c "\\dt"
docker exec "$POSTGRES_CONTAINER_NAME" psql -U "$POSTGRES_USER" -d topopass_restore -c "select count(*) from profiles;"
```

Check application-specific tables such as `practice_attempts`,
`question_attempts`, `mock_attempts`, `mock_question_attempts`, and
`question_bank_items`.

## 6. Restart The App

```bash
cd /srv/topopass
docker compose -f deploy/docker-compose.prod.yml up -d
docker compose -f deploy/docker-compose.prod.yml logs -f app
```

## 7. Restore Drill Checklist

- Restore into a temporary database or isolated host.
- Confirm `pg_restore` completes without unexpected errors.
- Confirm expected table counts.
- Confirm RLS policies and admin/profile data exist.
- Confirm the app can connect to the restored database in a safe test
  environment.
- Document the backup key, restore duration, and any manual steps required.

## Storage Objects

Postgres logical backups do not restore Supabase Storage object files. Restore
storage archives separately from `storage/YYYY/MM/` if deleted objects need to
be recovered.
