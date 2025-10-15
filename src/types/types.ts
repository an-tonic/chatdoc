
export type ImageMessage = {
    localDBID: number; type: 'image'; uri: string; description: string; source: 'user' | 'search'; serverID?: number
}

export type ServerDocument = {
    server_id: number;
    image_url: string;
    description: string;
    distance: number;
}


export const SERVER_URL = "http://107.172.80.108:3000";
