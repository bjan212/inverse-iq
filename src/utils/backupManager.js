/**
 * Database Backup and Recovery Manager
 *
 * Provides automated backup, recovery, and maintenance for all JSON databases
 * in the trading data collection service.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);
const unlink = promisify(fs.unlink);

class BackupManager {
  constructor(options = {}) {
    this.backupDir = options.backupDir || './backups';
    this.maxBackups = options.maxBackups || 10; // Keep last 10 backups
    this.backupInterval = options.backupInterval || 3600000; // 1 hour default
    this.autoBackup = options.autoBackup !== false; // Enable auto-backup by default

    // Database files to backup
    this.databases = [
      './data/pattern_database.json',
      './data/hybrid_pattern_database.json',
      './data/continuous_learning_database.json',
      './data/active_signals.json',
      './data/subscribers.json'
    ];

    // Ensure backup directory exists
    this.ensureBackupDir();

    // Start auto-backup if enabled
    if (this.autoBackup) {
      this.startAutoBackup();
    }
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDir() {
    try {
      await mkdir(this.backupDir, { recursive: true });
      console.log(`✅ Backup directory ready: ${this.backupDir}`);
    } catch (error) {
      console.error('Failed to create backup directory:', error.message);
    }
  }

  /**
   * Create a backup of all databases
   */
  async createBackup(backupName = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFolderName = backupName || `backup-${timestamp}`;
    const backupPath = path.join(this.backupDir, backupFolderName);

    try {
      // Create backup folder
      await mkdir(backupPath, { recursive: true });

      const backupInfo = {
        timestamp: new Date().toISOString(),
        databases: [],
        totalSize: 0
      };

      console.log(`\n💾 Creating backup: ${backupFolderName}`);

      // Backup each database
      for (const dbPath of this.databases) {
        const dbName = path.basename(dbPath);
        const backupFilePath = path.join(backupPath, dbName);

        try {
          // Check if database file exists
          await stat(dbPath);

          // Copy database file
          await copyFile(dbPath, backupFilePath);

          // Get file stats
          const stats = await stat(backupFilePath);
          const sizeKB = (stats.size / 1024).toFixed(2);

          backupInfo.databases.push({
            name: dbName,
            originalPath: dbPath,
            backupPath: backupFilePath,
            size: stats.size,
            sizeKB: sizeKB
          });

          backupInfo.totalSize += stats.size;

          console.log(`   ✅ ${dbName} (${sizeKB} KB)`);

        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log(`   ⚠️  ${dbName} not found (skipping)`);
          } else {
            console.error(`   ❌ Failed to backup ${dbName}:`, error.message);
          }
        }
      }

      // Save backup metadata
      const metadataPath = path.join(backupPath, 'backup-info.json');
      await fs.promises.writeFile(metadataPath, JSON.stringify(backupInfo, null, 2));

      console.log(`✅ Backup completed: ${backupFolderName}`);
      console.log(`   Total size: ${(backupInfo.totalSize / 1024).toFixed(2)} KB`);
      console.log(`   Databases backed up: ${backupInfo.databases.length}`);

      // Cleanup old backups
      await this.cleanupOldBackups();

      return {
        success: true,
        backupName: backupFolderName,
        path: backupPath,
        info: backupInfo
      };

    } catch (error) {
      console.error('Backup failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restore from a backup
   */
  async restoreBackup(backupName) {
    const backupPath = path.join(this.backupDir, backupName);

    try {
      // Check if backup exists
      await stat(backupPath);

      // Read backup metadata
      const metadataPath = path.join(backupPath, 'backup-info.json');
      const metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));

      console.log(`\n🔄 Restoring backup: ${backupName}`);
      console.log(`   Created: ${metadata.timestamp}`);
      console.log(`   Databases: ${metadata.databases.length}`);

      const restoreResults = [];

      // Restore each database
      for (const db of metadata.databases) {
        try {
          const backupFilePath = path.join(backupPath, db.name);

          // Create backup of current file (safety)
          const currentFileBackup = `${db.originalPath}.backup`;
          if (fs.existsSync(db.originalPath)) {
            await copyFile(db.originalPath, currentFileBackup);
          }

          // Restore from backup
          await copyFile(backupFilePath, db.originalPath);

          restoreResults.push({
            database: db.name,
            status: 'restored',
            size: db.sizeKB + ' KB'
          });

          console.log(`   ✅ ${db.name} restored (${db.sizeKB} KB)`);

        } catch (error) {
          console.error(`   ❌ Failed to restore ${db.name}:`, error.message);
          restoreResults.push({
            database: db.name,
            status: 'failed',
            error: error.message
          });
        }
      }

      console.log(`✅ Restore completed: ${backupName}`);

      return {
        success: true,
        backupName: backupName,
        restored: restoreResults.filter(r => r.status === 'restored').length,
        failed: restoreResults.filter(r => r.status === 'failed').length,
        results: restoreResults
      };

    } catch (error) {
      console.error('Restore failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List all available backups
   */
  async listBackups() {
    try {
      const entries = await readdir(this.backupDir);
      const backups = [];

      for (const entry of entries) {
        const entryPath = path.join(this.backupDir, entry);
        const stats = await stat(entryPath);

        if (stats.isDirectory()) {
          // Try to read backup metadata
          let metadata = null;
          try {
            const metadataPath = path.join(entryPath, 'backup-info.json');
            metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));
          } catch (error) {
            // Metadata not available
          }

          backups.push({
            name: entry,
            path: entryPath,
            created: stats.birthtime,
            modified: stats.mtime,
            size: stats.size,
            metadata: metadata
          });
        }
      }

      // Sort by creation time (newest first)
      backups.sort((a, b) => new Date(b.created) - new Date(a.created));

      return backups;

    } catch (error) {
      console.error('Failed to list backups:', error.message);
      return [];
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupName) {
    const backupPath = path.join(this.backupDir, backupName);

    try {
      // Check if backup exists
      await stat(backupPath);

      // Get list of files in backup
      const files = await readdir(backupPath);

      // Delete all files
      for (const file of files) {
        const filePath = path.join(backupPath, file);
        await unlink(filePath);
      }

      // Delete backup directory
      await fs.promises.rmdir(backupPath);

      console.log(`🗑️  Deleted backup: ${backupName}`);

      return {
        success: true,
        backupName: backupName
      };

    } catch (error) {
      console.error('Failed to delete backup:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup old backups (keep only maxBackups)
   */
  async cleanupOldBackups() {
    try {
      const backups = await this.listBackups();

      if (backups.length <= this.maxBackups) {
        return; // No cleanup needed
      }

      const toDelete = backups.slice(this.maxBackups);
      console.log(`🧹 Cleaning up ${toDelete.length} old backups (keeping ${this.maxBackups})`);

      for (const backup of toDelete) {
        await this.deleteBackup(backup.name);
      }

    } catch (error) {
      console.error('Failed to cleanup old backups:', error.message);
    }
  }

  /**
   * Start automatic backup
   */
  startAutoBackup() {
    console.log(`⏰ Auto-backup enabled (every ${this.backupInterval / 1000 / 60} minutes)`);

    this.backupTimer = setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        console.error('Auto-backup failed:', error.message);
      }
    }, this.backupInterval);
  }

  /**
   * Stop automatic backup
   */
  stopAutoBackup() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
      console.log('⏰ Auto-backup stopped');
    }
  }

  /**
   * Get backup statistics
   */
  async getStats() {
    try {
      const backups = await this.listBackups();
      let totalSize = 0;
      let oldestBackup = null;
      let newestBackup = null;

      for (const backup of backups) {
        totalSize += backup.size || 0;

        if (!oldestBackup || backup.created < oldestBackup) {
          oldestBackup = backup.created;
        }

        if (!newestBackup || backup.created > newestBackup) {
          newestBackup = backup.created;
        }
      }

      return {
        totalBackups: backups.length,
        totalSize: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        oldestBackup: oldestBackup,
        newestBackup: newestBackup,
        autoBackupEnabled: this.autoBackup,
        backupInterval: this.backupInterval,
        maxBackups: this.maxBackups
      };

    } catch (error) {
      console.error('Failed to get backup stats:', error.message);
      return null;
    }
  }

  /**
   * Validate backup integrity
   */
  async validateBackup(backupName) {
    const backupPath = path.join(this.backupDir, backupName);

    try {
      // Check if backup exists
      await stat(backupPath);

      // Read metadata
      const metadataPath = path.join(backupPath, 'backup-info.json');
      const metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));

      const validationResults = {
        backupName: backupName,
        valid: true,
        issues: [],
        databases: []
      };

      // Validate each database file
      for (const db of metadata.databases) {
        const backupFilePath = path.join(backupPath, db.name);

        try {
          const stats = await stat(backupFilePath);

          if (stats.size !== db.size) {
            validationResults.issues.push(`${db.name}: Size mismatch (${stats.size} vs ${db.size})`);
            validationResults.valid = false;
          }

          // Try to parse JSON
          const content = await fs.promises.readFile(backupFilePath, 'utf8');
          JSON.parse(content); // Validate JSON

          validationResults.databases.push({
            name: db.name,
            valid: true,
            size: stats.size
          });

        } catch (error) {
          validationResults.issues.push(`${db.name}: ${error.message}`);
          validationResults.valid = false;
          validationResults.databases.push({
            name: db.name,
            valid: false,
            error: error.message
          });
        }
      }

      return validationResults;

    } catch (error) {
      return {
        backupName: backupName,
        valid: false,
        issues: [`Failed to validate backup: ${error.message}`]
      };
    }
  }
}

module.exports = BackupManager;
