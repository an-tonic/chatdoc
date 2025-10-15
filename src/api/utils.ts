import RNFS from "react-native-fs";
import {DB} from "@op-engineering/op-sqlite";
import {Alert} from "react-native";
import {t} from "../languages/i18n";


export const savePhotoToLocal = async (db: DB, filePath: string) => {

    const extension = filePath.substring(filePath.lastIndexOf(".") + 1);
    const savedFilePath = `${RNFS.ExternalDirectoryPath}/photo_${Date.now()}.${extension}`;
    await RNFS.copyFile(filePath, savedFilePath);
    console.log("File saved to: ", savedFilePath);

    const uri = savedFilePath.startsWith('file://') ? savedFilePath : `file://${savedFilePath}`;
    const savedFileID = await insertNewFile(db, uri);
    console.log("File saved to DB with id: ", uri);

    return {savedFileID, savedFilePath:uri}
};

async function insertNewFile(db: DB, filePath: string):Promise<number> {
    try {
        const insertResult = await db.execute(
            `INSERT OR IGNORE INTO documents (path, synced)
                 VALUES (?, 0)`,
            [filePath]
        );

        if (insertResult.insertId) return insertResult.insertId;

    } catch (err) {
        console.error('SQL error:', err);
    }
    return -1;
}

export async function searchSimilarEmbedding(db: DB, embedding: number[], limit = 10) {
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
            [new Float32Array(embedding), limit]
        );

        if (results.rows.length > 0) {
            const {id, path, description, distance } = results.rows[0];
            if (path){
                return {id: Number(id), path: path.toString(), description: description?.toString(), distance: distance?.toString() };
            }
        }
    } catch (err) {
        console.error('SQL error:', err);
    }
    return null;
}

export async function updateEmbeddingByID(db: DB, documentId: number, newEmbedding: number[], newDescription: string) {
    try {

        const update = await db.execute(
            `UPDATE metadata
                 SET embedding = ?, description = ?, synced = 0
                 WHERE document_id = ?`,
            [new Float32Array(newEmbedding), newDescription, documentId]
        );

        if (update.rowsAffected === 0) {
            await db.execute(
                `INSERT INTO metadata (document_id, embedding, description, synced)
                     VALUES (?, ?, ?, 0)`,
                [documentId, new Float32Array(newEmbedding), newDescription]
            );
        }
    } catch (err) {
        console.error('SQL error:', err);
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