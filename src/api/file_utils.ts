import PdfThumbnail from '@angelcat/rn-pdf-thumbnail';
import {FileType} from '../types/types.ts';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'];
const PDF_EXTENSIONS = ['pdf'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm'];

export function getFileType(filePath: string): FileType {
    const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
    if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
    if (PDF_EXTENSIONS.includes(ext)) return 'pdf';
    if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
    return 'image'; // fallback
}

export async function generateThumbnail(filePath: string, fileType: FileType): Promise<string> {
    switch (fileType) {
        case 'image':
            return filePath;

        case 'pdf': {
            const result = await PdfThumbnail.generate(filePath, 0);
            return result.uri;
        }

        case 'video':
            // TODO: implement video first frame extraction
            // e.g. react-native-create-thumbnail
            throw new Error('Video thumbnails not yet supported');
    }
}