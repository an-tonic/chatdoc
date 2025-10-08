
export type ImageMessage = {
    databaseID: number; type: 'image'; uri: string; description: string; source: 'user' | 'search'; serverID?: number
}