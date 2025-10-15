import {DB} from "@op-engineering/op-sqlite";
import {SERVER_URL} from "../types/types.ts";


export async function searchSimilarDocuments(embedding: any, topK: number = 5) {
    try {


        const res = await fetch(`${SERVER_URL}/search`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({embedding: JSON.stringify(embedding), topK: topK}),
        });

        if (!res.ok) {
            throw new Error(`Search failed with status ${res.status}`);
        }

        const data = await res.json();
        return data.map((doc: any) => ({
            server_id: doc.id,
            image_url: doc.image_url,
            description: doc.description,
            distance: doc.distance,
        }));

    } catch (err) {
        console.error("Search request failed:", err);
        return [];
    }
}


export async function syncUnsyncedDocuments(db: DB) {
    if (!db) return;

    try {
        // --- SYNC DOCUMENTS ---
        // TODO - not sent files that were saved from server
        const unsyncedDocs =
            await db.execute(`SELECT *
                              FROM documents
                              WHERE synced = 0`);

        for (const unsyncedDoc of unsyncedDocs.rows) {
            try {
                if (!unsyncedDoc.path) {
                    console.error("Could not sync this doc. Path missing?", unsyncedDoc)
                    continue;
                }

                const formData = new FormData();
                const fileName = String(unsyncedDoc.path).split('/').pop();

                formData.append('image', {
                    uri: unsyncedDoc.path,
                    name: fileName,
                    type: 'image/jpeg',
                } as any);

                const res = await fetch(`${SERVER_URL}/upload`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                const server_data = await res.json();
                console.log('Uploaded document file:', server_data);

                if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
                await db.execute(`UPDATE documents
                                  SET synced = 1
                                  WHERE id = ${unsyncedDoc.id}`
                );

                await db.execute(`UPDATE metadata
                                  SET server_doc_id = ${server_data.id}
                                  WHERE document_id = ${unsyncedDoc.id}`
                );

            } catch (err) {
                console.error(`Failed to sync document id ${unsyncedDoc.id}:`, err);
            }
        }
        console.log("Finished uploading docs");
        // --- SYNC METADATA ---
        const unsyncedMeta =
            await db.execute(`SELECT *
                              FROM metadata
                              WHERE synced = 0`);

        for (const meta of unsyncedMeta.rows) {
            try {
                let floatArray: number[] = [];

                if (meta.embedding && meta.embedding instanceof ArrayBuffer) {
                    floatArray = Array.from(new Float32Array(meta.embedding));
                }

                const res = await fetch(`${SERVER_URL}/embed`, {
                    method: 'POST',
                    body: JSON.stringify({
                        id: meta.server_doc_id,
                        embedding: floatArray,
                        description: meta.description,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                console.log(res, meta.server_doc_id);
                if (!res.ok) throw new Error(`Embed update failed with status ${res.status}`);
                await db.execute(`UPDATE metadata
                                  SET synced = 1
                                  WHERE id = ${meta.id}`);
            } catch (err) {
                console.error(`Failed to sync metadata id ${meta.id}:`, err);
            }
        }

        console.log('Sync metadata finished');

    } catch (err) {
        console.error('Sync failed:', err);
    }
}
