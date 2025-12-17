import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import pathz from 'path';

const execPromise = promisify(exec);

export const downloadMp3V2 = async (url, outputPath, bitrate = '128k') => {
    try {
        // O parâmetro --audio-quality define o bitrate (ex: 128k, 192k, 320k)
        const command = `yt-dlp --no-warnings --no-check-certificate -f "ba" -x --audio-format mp3 --audio-quality ${bitrate} --max-filesize 50M -o "${outputPath}" "${url}"`;
        await execPromise(command);
        return outputPath;
    } catch (error) {
        throw error;
    }
};