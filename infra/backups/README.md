# TopoPass Backups

These scripts are intended to run on the production EC2 host after the Docker
Compose stack is deployed. They do not contain secrets and should read runtime
values from a host-only env file such as `/opt/topopass/.env.production`.

Logical Postgres backups are the primary restore path. EBS snapshots are useful
for host recovery, but they are not a substitute for tested `pg_dump` /
`pg_restore` backups.

## Required Host Env Values

Add these values to the host-only env file. Do not commit the file.

```bash
BACKUP_S3_BUCKET=your-topopass-backup-bucket
BACKUP_S3_PREFIX=topopass
POSTGRES_CONTAINER_NAME=supabase-db
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=replace-on-host-only
COMPOSE_PROJECT_DIR=/srv/topopass
BACKUP_WORK_DIR=/srv/topopass-data/backups/postgres
BACKUP_LOG_DIR=/var/log/topopass/backups
STORAGE_SOURCE_DIR=/srv/topopass-data/storage
MAX_BACKUP_AGE_HOURS=36
```

The EC2 instance role should have S3 access only to the Terraform-managed backup
bucket and prefix.

## Postgres Backup

Dry run:

```bash
BACKUP_ENV_FILE=/opt/topopass/.env.production /srv/topopass/infra/backups/backup-postgres.sh --dry-run
```

Run a backup:

```bash
BACKUP_ENV_FILE=/opt/topopass/.env.production /srv/topopass/infra/backups/backup-postgres.sh
```

The script:

- runs `pg_dump -Fc` from the running Postgres container
- writes a temporary custom-format `.dump` archive locally
- uploads to `s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/postgres/YYYY/MM/`
- removes the local dump after upload
- logs to `/var/log/topopass/backups/postgres-backup.log`
- exits non-zero on failure

It does not print `POSTGRES_PASSWORD`.

## Storage Backup

Database backups do not restore deleted Supabase Storage objects. If Supabase
Storage is mounted at `/srv/topopass-data/storage`, run a separate storage
backup:

```bash
BACKUP_ENV_FILE=/opt/topopass/.env.production /srv/topopass/infra/backups/backup-storage.sh
```

This uploads compressed archives to
`s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/storage/YYYY/MM/`.

## Verify Latest Backup

```bash
BACKUP_ENV_FILE=/opt/topopass/.env.production /srv/topopass/infra/backups/verify-latest-backup.sh
```

For storage:

```bash
BACKUP_KIND=storage BACKUP_ENV_FILE=/opt/topopass/.env.production /srv/topopass/infra/backups/verify-latest-backup.sh
```

## Enable Daily Systemd Timer

From the EC2 host:

```bash
sudo cp /srv/topopass/infra/backups/systemd/topopass-postgres-backup.service /etc/systemd/system/
sudo cp /srv/topopass/infra/backups/systemd/topopass-postgres-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now topopass-postgres-backup.timer
systemctl list-timers topopass-postgres-backup.timer
```

The timer runs daily at 02:30 server time. It is not enabled automatically by
Terraform or repository scripts.

## Manual Checks

- Confirm `aws sts get-caller-identity` works on the EC2 host role.
- Confirm `aws s3 ls "s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/"` works.
- Confirm the Postgres container name is correct.
- Run a dry run before enabling the timer.
- Run one real backup and verify the object exists and is non-empty.
- Perform a restore drill before launch.
