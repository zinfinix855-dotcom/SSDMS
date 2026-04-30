#!/bin/bash
# SSDMS Database Backup Script

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
CONTAINER_NAME="sehatsahulatdeparmentmanagmentsystem-db-1" # Often resolved dynamically

mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."
docker exec $CONTAINER_NAME mysqldump -u root -p"Ssdms@2026" ssdms > "$BACKUP_DIR/ssdms_backup_$TIMESTAMP.sql"

if [ $? -eq 0 ]; then
  echo "✅ Backup successfully saved to: $BACKUP_DIR/ssdms_backup_$TIMESTAMP.sql"
else
  echo "❌ Backup failed!"
  exit 1
fi
