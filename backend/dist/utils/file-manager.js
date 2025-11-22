"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDirectoryExists = ensureDirectoryExists;
exports.writeFile = writeFile;
exports.readFile = readFile;
exports.downloadFile = downloadFile;
exports.exists = exists;
exports.listFiles = listFiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const https = __importStar(require("https"));
/**
 * Ensures that a directory exists, creating it if necessary
 * @param dirPath The directory path to ensure exists
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
/**
 * Writes content to a file, creating directories as needed
 * @param filePath The file path to write to
 * @param content The content to write
 */
async function writeFile(filePath, content) {
    const dir = path.dirname(filePath);
    ensureDirectoryExists(dir);
    return fs.promises.writeFile(filePath, content, "utf-8");
}
/**
 * Reads content from a file
 * @param filePath The file path to read from
 * @returns The file content as a string
 */
async function readFile(filePath) {
    return fs.promises.readFile(filePath, "utf-8");
}
/**
 * Downloads a file from a URL to a local path
 * @param url The URL to download from
 * @param filePath The local file path to save to
 * @returns Promise that resolves to the file path
 */
function downloadFile(url, filePath) {
    const dir = path.dirname(filePath);
    ensureDirectoryExists(dir);
    return new Promise((resolve, reject) => {
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
            fs.unlink(filePath, () => { });
            reject(err);
        });
    });
}
/**
 * Checks if a file or directory exists
 * @param filePath The path to check
 * @returns True if the path exists, false otherwise
 */
function exists(filePath) {
    return fs.existsSync(filePath);
}
/**
 * Lists all files in a directory
 * @param dirPath The directory path
 * @returns Array of file names
 */
async function listFiles(dirPath) {
    if (!exists(dirPath)) {
        return [];
    }
    return fs.promises.readdir(dirPath);
}
