#!/usr/bin/env node

/**
 * Backup Manager CLI
 *
 * Command-line interface for managing database backups
 * Usage: node scripts/backupManager.js <command> [options]
 */

const BackupManager = require('../src/utils/backupManager');

class BackupCLI {
  constructor() {
    this.backupManager = new BackupManager();
  }

  /**
   * Parse command line arguments
   */
  parseArgs() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'create':
        return this.createBackup(args[1]);

      case 'restore':
        return this.restoreBackup(args[1]);

      case 'list':
        return this.listBackups();

      case 'delete':
        return this.deleteBackup(args[1]);

      case 'validate':
        return this.validateBackup(args[1]);

      case 'stats':
        return this.showStats();

      case 'cleanup':
        return this.cleanup();

      default:
        this.showHelp();
        break;
    }
  }

  /**
   * Create a backup
   */
  async createBackup(name) {
    console.log('Creating backup...');
    const result = await this.backupManager.createBackup(name);

    if (result.success) {
      console.log(`✅ Backup created: ${result.backupName}`);
      console.log(`📁 Location: ${result.path}`);
    } else {
      console.error(`❌ Backup failed: ${result.error}`);
      process.exit(1);
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(name) {
    if (!name) {
      console.error('❌ Please specify backup name to restore');
      console.log('Usage: node scripts/backupManager.js restore <backup-name>');
      process.exit(1);
    }

    console.log(`Restoring from backup: ${name}...`);
    const result = await this.backupManager.restoreBackup(name);

    if (result.success) {
      console.log(`✅ Restore completed: ${result.backupName}`);
      console.log(`📊 Restored: ${result.restored} databases`);
      if (result.failed > 0) {
        console.log(`⚠️  Failed: ${result.failed} databases`);
      }
    } else {
      console.error(`❌ Restore failed: ${result.error}`);
      process.exit(1);
    }
  }

  /**
   * List all backups
   */
  async listBackups() {
    const backups = await this.backupManager.listBackups();

    if (backups.length === 0) {
      console.log('📁 No backups found');
      return;
    }

    console.log('📁 Available backups:');
    console.log('─'.repeat(80));

    backups.forEach((backup, index) => {
      const date = new Date(backup.created).toLocaleString();
      const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
      const dbCount = backup.metadata?.databases?.length || 0;

      console.log(`${index + 1}. ${backup.name}`);
      console.log(`   📅 Created: ${date}`);
      console.log(`   📊 Databases: ${dbCount}`);
      console.log(`   💾 Size: ${sizeMB} MB`);
      console.log('');
    });
  }

  /**
   * Delete a backup
   */
  async deleteBackup(name) {
    if (!name) {
      console.error('❌ Please specify backup name to delete');
      console.log('Usage: node scripts/backupManager.js delete <backup-name>');
      process.exit(1);
    }

    console.log(`Deleting backup: ${name}...`);
    const result = await this.backupManager.deleteBackup(name);

    if (result.success) {
      console.log(`✅ Backup deleted: ${result.backupName}`);
    } else {
      console.error(`❌ Delete failed: ${result.error}`);
      process.exit(1);
    }
  }

  /**
   * Validate backup integrity
   */
  async validateBackup(name) {
    if (!name) {
      console.error('❌ Please specify backup name to validate');
      console.log('Usage: node scripts/backupManager.js validate <backup-name>');
      process.exit(1);
    }

    console.log(`Validating backup: ${name}...`);
    const result = await this.backupManager.validateBackup(name);

    if (result.valid) {
      console.log(`✅ Backup is valid: ${result.backupName}`);
      console.log(`📊 Valid databases: ${result.databases.filter(d => d.valid).length}/${result.databases.length}`);
    } else {
      console.log(`❌ Backup has issues: ${result.backupName}`);
      result.issues.forEach(issue => console.log(`   ⚠️  ${issue}`));
      process.exit(1);
    }
  }

  /**
   * Show backup statistics
   */
  async showStats() {
    const stats = await this.backupManager.getStats();

    if (!stats) {
      console.error('❌ Failed to get backup statistics');
      process.exit(1);
    }

    console.log('📊 Backup Statistics:');
    console.log('─'.repeat(40));
    console.log(`Total backups: ${stats.totalBackups}`);
    console.log(`Total size: ${stats.totalSizeMB} MB`);
    console.log(`Auto-backup: ${stats.autoBackupEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`Backup interval: ${stats.backupInterval / 1000 / 60} minutes`);
    console.log(`Max backups: ${stats.maxBackups}`);

    if (stats.oldestBackup) {
      console.log(`Oldest backup: ${new Date(stats.oldestBackup).toLocaleString()}`);
    }

    if (stats.newestBackup) {
      console.log(`Newest backup: ${new Date(stats.newestBackup).toLocaleString()}`);
    }
  }

  /**
   * Cleanup old backups
   */
  async cleanup() {
    console.log('Cleaning up old backups...');
    await this.backupManager.cleanupOldBackups();
    console.log('✅ Cleanup completed');
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log('🔧 Backup Manager CLI');
    console.log('');
    console.log('Usage: node scripts/backupManager.js <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  create [name]     Create a new backup (optional custom name)');
    console.log('  restore <name>    Restore from a specific backup');
    console.log('  list              List all available backups');
    console.log('  delete <name>     Delete a specific backup');
    console.log('  validate <name>   Validate backup integrity');
    console.log('  stats             Show backup statistics');
    console.log('  cleanup           Remove old backups (keep max backups)');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/backupManager.js create');
    console.log('  node scripts/backupManager.js create my-backup');
    console.log('  node scripts/backupManager.js restore backup-2024-01-01');
    console.log('  node scripts/backupManager.js list');
    console.log('  node scripts/backupManager.js validate backup-2024-01-01');
  }

  /**
   * Run the CLI
   */
  async run() {
    try {
      await this.parseArgs();
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new BackupCLI();
  cli.run();
}

module.exports = BackupCLI;
