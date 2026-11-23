#!/bin/bash
set -e

# === CONFIGURACIÓN ===
PROYECTO_DIR="/var/www/aerogas"
BACKUP_DIR="/var/backups/aerogas"
FECHA=$(date +"%Y-%m-%d_%H-%M")
RETENCION_DIAS=30

# Cargar credenciales desde .env.local del proyecto
set -a
source "$PROYECTO_DIR/.env.local"
set +a

mkdir -p "$BACKUP_DIR"

# 1. Respaldo comprimido de MySQL (aerogas_db)
mysqldump \
  -h "${DB_HOST:-localhost}" \
  -P "${DB_PORT:-3306}" \
  -u "$DB_USER" \
  -p"$DB_PASSWORD" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" | gzip > "$BACKUP_DIR/db_${DB_NAME}_${FECHA}.sql.gz"

# 2. Respaldo comprimido de archivos subidos (estaciones, promos, CVs, catálogos)
tar -czf "$BACKUP_DIR/uploads_${FECHA}.tar.gz" -C "$PROYECTO_DIR/public" uploads

# 3. Limpiar respaldos mayores a 30 días
find "$BACKUP_DIR" -type f -mtime +$RETENCION_DIAS -delete

echo "Respaldo completado: $FECHA"