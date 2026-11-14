import archiver from 'archiver';
import { contentDisposition } from './contentDisposition';
import { Response } from 'express';
import axios from 'axios';
import { logger } from './logger';
import https from 'https';

export interface ZipFileEntry {
  url: string;          // Download URL from Plex
  filename: string;     // Filename to use inside the zip
  size?: number;        // Optional file size for progress tracking
}

// HTTPS agent that bypasses SSL certificate validation for local Plex servers
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

/**
 * Creates a zip archive from multiple files and streams it to the response
 * @param res Express response object
 * @param files Array of files to include in the zip
 * @param zipFilename Name of the zip file
 * @returns Promise that resolves when the zip is complete
 */
export const createZipStream = async (
  res: Response,
  files: ZipFileEntry[],
  zipFilename: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Calculate total size for progress tracking
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
    let bytesWritten = 0;

    // Create archiver instance
    // store: no deflate pass at all (media files are already compressed, zlib level 0 still costs CPU)
    const archive = archiver('zip', { store: true });

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', contentDisposition(zipFilename));
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Don't set Content-Length for ZIP files - it's hard to predict exactly
    // due to varying compression and metadata overhead. Let it stream without
    // a known size to avoid ERR_CONTENT_LENGTH_MISMATCH errors.

    // Pipe archive to response
    archive.pipe(res);

    // Track progress
    archive.on('progress', (progress) => {
      bytesWritten = progress.fs.processedBytes;
      const percent = totalSize > 0 ? Math.round((bytesWritten / totalSize) * 100) : 0;
      logger.debug('Zip progress', {
        bytesWritten,
        totalSize,
        percent,
        filesProcessed: progress.entries.processed,
        totalFiles: files.length
      });
    });

    // Handle errors
    archive.on('error', (err) => {
      logger.error('Archive error', { error: err });
      reject(err);
    });

    // Handle completion
    archive.on('end', () => {
      logger.info('Zip archive completed', {
        zipFilename,
        filesIncluded: files.length,
        totalBytes: bytesWritten
      });
      resolve();
    });

    // Handle response errors (client disconnected, etc.)
    res.on('error', (err) => {
      logger.error('Response stream error', { error: err });
      archive.destroy();
      reject(err);
    });

    res.on('close', () => {
      // Client disconnected before completion
      if (!res.writableEnded) {
        logger.warn('Client disconnected before zip completed', { zipFilename });
        archive.destroy();
      }
    });

    // Open one Plex stream at a time: the next file is requested only when the archive has
    // finished the previous one. Opening them all up front left dozens of idle connections
    // to Plex competing for the disk and timing out on long ZIPs.
    let index = 0;
    const appendNext = async (): Promise<void> => {
      if (index >= files.length) {
        await archive.finalize();
        return;
      }
      const file = files[index++];
      try {
        const response = await axios({ method: 'GET', url: file.url, responseType: 'stream', httpsAgent });
        archive.append(response.data, { name: file.filename });
      } catch (error) {
        // Skip a file Plex can't serve rather than failing the whole ZIP
        logger.error('Failed to add file to zip', { filename: file.filename, error });
        return appendNext();
      }
    };

    archive.on('entry', () => {
      appendNext().catch((err) => {
        logger.error('Error adding files to zip', { error: err });
        archive.destroy();
        reject(err);
      });
    });

    appendNext().catch((err) => {
      logger.error('Error adding files to zip', { error: err });
      archive.destroy();
      reject(err);
    });
  });
};

