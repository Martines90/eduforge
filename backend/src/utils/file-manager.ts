import * as fs from "fs";
import * as path from "path";
import * as https from "https";

/**
 * Ensures that a directory exists, creating it if necessary
 * @param dirPath The directory path to ensure exists
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Writes content to a file, creating directories as needed
 * @param filePath The file path to write to
 * @param content The content to write
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  const dir = path.dirname(filePath);
  ensureDirectoryExists(dir);
  return fs.promises.writeFile(filePath, content, "utf-8");
}

/**
 * Reads content from a file
 * @param filePath The file path to read from
 * @returns The file content as a string
 */
export async function readFile(filePath: string): Promise<string> {
  return fs.promises.readFile(filePath, "utf-8");
}

/**
 * Downloads a file from a URL to a local path
 * @param url The URL to download from
 * @param filePath The local file path to save to
 * @returns Promise that resolves to the file path
 */
export function downloadFile(url: string, filePath: string): Promise<string> {
  const dir = path.dirname(filePath);
  ensureDirectoryExists(dir);

  return new Promise<string>((resolve, reject) => {
    const file = fs.createWriteStream(filePath);

    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(filePath);
        });
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
  });
}

/**
 * Checks if a file or directory exists
 * @param filePath The path to check
 * @returns True if the path exists, false otherwise
 */
export function exists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Lists all files in a directory
 * @param dirPath The directory path
 * @returns Array of file names
 */
export async function listFiles(dirPath: string): Promise<string[]> {
  if (!exists(dirPath)) {
    return [];
  }
  return fs.promises.readdir(dirPath);
}
