#!/bin/bash
# SSDMS Database Restore Script

if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <path_to_backup.sql>"
  exit 1
fi

BACKUP_FILE=$1
CONTAINER_NAME="sehatsahulatdeparmentmanagmentsystem-db-1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file not found at $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will overwrite the current database."
read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Starting restore from $BACKUP_FILE..."
  cat "$BACKUP_FILE" | docker exec -i $CONTAINER_NAME mysql -u root -p"Ssdms@2026" ssdms
  
  if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
  else
    echo "❌ Restore failed!"
    exit 1
  fi
else
  echo "Restore cancelled."
fi
