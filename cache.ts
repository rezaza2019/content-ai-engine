import path from "path";
import fs from "fs";
import crypto from "crypto";
import { CACHE_TTL } from "./config";

export function getCachePaths(url: string) {
  const urlHash = crypto.createHash("md5").update(url).digest("hex");
  const cacheDir = path.join(process.cwd(), ".cache");
  
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const cachePath = path.join(cacheDir, `${urlHash}.json`);
  const tempPath = path.join(cacheDir, `${urlHash}.tmp`);
  return { cachePath, tempPath };
}

export function isCacheValid(cachePath: string): boolean {
  if (fs.existsSync(cachePath)) {
    const stats = fs.statSync(cachePath);
    return Date.now() - stats.mtimeMs < CACHE_TTL;
  }
  return false;
}

export function serveFromCache(cachePath: string, res: any) {
  console.log(`Serving from file cache`);
  res.setHeader("Content-Type", "application/json");
  fs.createReadStream(cachePath).pipe(res);
}

export function pipeToCache(responseBody: any, cachePath: string, tempPath: string, res: any) {
  res.setHeader("Content-Type", "application/json");
  const fileStream = fs.createWriteStream(tempPath);
  
  responseBody.pipe(fileStream);
  responseBody.pipe(res);
  
  fileStream.on('finish', () => {
    try {
      fs.renameSync(tempPath, cachePath);
    } catch (e) {
      console.error("Failed to rename temp cache file", e);
    }
  });
}
