import RNFS from "react-native-fs";
import {DB} from "@op-engineering/op-sqlite";
import {Alert} from "react-native";
import {t} from "../languages/i18n";
import {LocalDocument, SERVER_URL, ServerDocument} from "../types/types.ts";


export async function doesFileExist(db: DB, serverDocId: number): Promise<boolean> {
    try {
        const result = await db.execute(
            `SELECT COUNT(*) as count FROM metadata WHERE server_doc_id = ?`,
            [serverDocId]
        );

        const countValue = result.rows?.[0]?.count ?? 0;
        const count = Number(countValue);
        return count > 0;

    } catch (err) {
        console.error('Failed to check metadata existence:', err);
        return false;
    }
}

export const saveFileFromRemoteFS = async (db: DB, doc: ServerDocument) => {
    try {
        const remoteUrl = SERVER_URL + doc.image_url;
        const extension = remoteUrl.substring(remoteUrl.lastIndexOf('.') + 1);
        const savedFilePath = `${RNFS.ExternalDirectoryPath}/photo_${Date.now()}.${extension}`;

        const result = await RNFS.downloadFile({
            fromUrl: remoteUrl,
            toFile: savedFilePath,
        }).promise;

        if (result.statusCode !== 200) {
            throw new Error(`Failed to download file: ${result.statusCode}`);
        }

        const uri = savedFilePath.startsWith('file://') ? savedFilePath : `file://${savedFilePath}`;
        const savedFileID = await insertNewFile(db, uri, 1);
        await updateMetadataLocalDB(db, savedFileID, doc.server_id, doc.description, doc.embedding, 1);
        console.log('File saved to DB with id:', savedFileID);

        return { savedFileID, savedFilePath: uri };
    } catch (err) {
        console.error('Failed to download or save remote file:', err);
        return { savedFileID: -1, savedFilePath: '' };
    }
};

export const saveFileFromLocalFS = async (db: DB, filePath: string) => {

    const extension = filePath.substring(filePath.lastIndexOf(".") + 1);
    const savedFilePath = `${RNFS.ExternalDirectoryPath}/photo_${Date.now()}.${extension}`;
    await RNFS.copyFile(filePath, savedFilePath);
    console.log("File saved to: ", savedFilePath);

    const uri = savedFilePath.startsWith('file://') ? savedFilePath : `file://${savedFilePath}`;
    const savedFileID = await insertNewFile(db, uri);
    console.log("File saved to DB with id: ", uri);

    return {savedFileID, savedFilePath:uri}
};

async function insertNewFile(db: DB, filePath: string, synced=0):Promise<number> {
    try {
        const insertResult = await db.execute(
            `INSERT OR IGNORE INTO documents (path, synced)
                 VALUES (?, ?)`,
            [filePath, synced]
        );

        if (insertResult.insertId) return insertResult.insertId;

    } catch (err) {
        console.error('SQL error:', err);
    }
    return -1;
}

export async function searchLocalDB(db: DB, embedding: number[], topK: number = 5): Promise<LocalDocument[] | null> {
    try {
        const results = await db.execute(
            `SELECT 
                 d.id,
                 d.path,
                 m.description,
                 vec_distance_cosine(m.embedding, ?) AS distance
             FROM metadata m
             JOIN documents d ON d.id = m.document_id
             WHERE m.embedding IS NOT NULL
             ORDER BY distance
             LIMIT ?`,
            [new Float32Array(embedding), topK]
        );
        if (results.rows.length > 0) {
            return results.rows.map((doc: any) => ({
                local_id: doc.id,
                image_url: doc.path,
                description: doc.description,
                embedding: null,
                distance: doc.distance,
            }));
        }
    } catch (err) {
        console.error('SQL error:', err);
    }
    return null;
}

export async function searchServerDB(embedding: number [], topK: number = 5): Promise<ServerDocument[] | null> {
    try {
        const res = await fetch(`${SERVER_URL}/search`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({embedding: JSON.stringify(embedding), topK: topK}),
        });

        if (!res.ok) {
            console.error(`Search failed with status ${res.status}`);
            return null;
        }

        const data = await res.json();
        return data.map((doc: any) => ({
            server_id: doc.id,
            image_url: doc.image_url,
            description: doc.description,
            embedding: JSON.parse(doc.embedding),
            distance: doc.distance,
        }));

    } catch (err) {
        console.log("Search request failed:", err);
        return null;
    }
}

export async function updateMetadataLocalDB(
    db: DB,
    localDBID: number,
    serverDBID: number | null = null,
    newDescription: string | null = null,
    newEmbedding: number[] | null = null,
    synced: number = 0
) {

    try {
        const fields: string[] = [];
        const values: any[] = [];

        if (serverDBID !== null) {
            fields.push("server_doc_id = ?");
            values.push(serverDBID);
        }

        if (newDescription !== null) {
            fields.push("description = ?");
            values.push(newDescription);
        }

        if (newEmbedding !== null) {
            fields.push("embedding = ?");
            values.push(new Float32Array(newEmbedding));
        }

        // Always include synced as a parameter to avoid string injection
        fields.push("synced = ?");
        values.push(synced);

        // Add WHERE parameter last
        values.push(localDBID);

        const sql = `UPDATE metadata SET ${fields.join(", ")} WHERE document_id = ?`;
        const result = await db.execute(sql, values);

        if (result.rowsAffected === 0) {
            await db.execute(
                `INSERT INTO metadata (document_id, server_doc_id, description, embedding, synced)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    localDBID,
                    serverDBID,
                    newDescription,
                    newEmbedding ? new Float32Array(newEmbedding) : null,
                    synced
                ]
            );
        }

    } catch (err) {
        console.error("SQL error:", err);
    }
}


export async function clearDatabase(db: DB) {

    try {
        await db.execute(`DELETE FROM documents`);
        Alert.alert(t('success'), t('documentsDeleted'));
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : t('deletionFailed');
        Alert.alert(t('error'), errorMessage);
    }
}