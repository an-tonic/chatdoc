
export type FileType = 'image' | 'pdf' | 'video';

export type DocMessage = {
    type: 'doc';
    localDBID: number;
    filePath: string;
    thumbnailUri: string;
    fileType: FileType;
    description: string;
    source: 'user' | 'search';
    cacheKey: number;
};

export type Point = {x: number; y: number};


export interface Document {
    image_url: string;
    description: string;
    embedding: number[] | null;
    distance: number;
}

export interface ServerDocument extends Document {
    server_id: number;
}

export interface LocalDocument extends Document {
    local_id: number;
}



export const SERVER_URL = "http://107.172.80.108:3000";
