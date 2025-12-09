import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import config from "../config";

/** Run shell command as Promise */
function shell(cmd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

/** Ensure mongodump and mongorestore are installed */
async function ensureMongoToolsInstalled(): Promise<void> {
  try {
    await shell("which mongodump");
    await shell("which mongorestore");
    console.log("MongoDB tools already installed ✓");
  } catch {
    console.log("MongoDB tools not found. Installing for Ubuntu Noble...");

    const installCmd = `
      sudo apt-get update &&
      sudo apt-get install -y gnupg curl ca-certificates &&
      curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo tee /usr/share/keyrings/mongodb-server-6.0.gpg > /dev/null &&
      echo "deb [signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list &&
      sudo apt-get update &&
      sudo apt-get install -y mongodb-database-tools
    `;

    await shell(installCmd);
    console.log("MongoDB tools installed successfully ✓");
  }
}

/**
 * Backup local MongoDB to MongoDB Atlas
 * @param localUri Local MongoDB URI
 * @param atlasUri MongoDB Atlas URI
 */
export async function backupToAtlas() {
  // Step 1: Ensure tools exist
  await ensureMongoToolsInstalled();

  // Step 2: Create backup folder
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(__dirname, `mongo-backup-${timestamp}.gz`);

  console.log("Creating local MongoDB backup...");

  await new Promise<void>((resolve, reject) => {
    exec(`mongodump --uri="${config.database_url}" --archive=${backupPath} --gzip`, (err) => {
      if (err) {
        console.error("Local backup failed:", err);
        return reject(err);
      }
      console.log("Local backup created at", backupPath);
      resolve();
    });
  });

  // Step 3: Restore to Atlas
  console.log("Restoring backup to MongoDB Atlas...");

  await new Promise<void>((resolve, reject) => {
    exec(`mongorestore --uri="${config.backup_database_url}" --archive=${backupPath} --gzip --drop`, (err) => {
      if (err) {
        console.error("Restore to Atlas failed:", err);
        return reject(err);
      }
      console.log("Backup restored to Atlas successfully ✓");
      resolve();
    });
  });

  // Step 4: Delete local backup
  fs.unlinkSync(backupPath);
  console.log("Local backup deleted.");
}