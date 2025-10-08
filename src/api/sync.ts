import {DB} from "@op-engineering/op-sqlite";

const SERVER_URL = "http://107.172.80.108:3000";

export async function syncUnsyncedDocuments(db: DB) {
    if (!db) return;

    try {
        // --- SYNC DOCUMENTS ---
        const unsyncedDocs =
            await db.execute(`SELECT *
                              FROM documents
                              WHERE synced = 0`);

        for (const doc of unsyncedDocs.rows) {
            try {
                if (!doc.path) {
                    console.error("Could not sync this doc. Path missing?", doc)
                    continue;
                }

                const formData = new FormData();
                const fileName = String(doc.path).split('/').pop();

                formData.append('image', {
                    uri: doc.path,
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

                if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
                await db.execute(`UPDATE documents
                                  SET synced = 1
                                  WHERE id = ${doc.id}`);

            } catch (err) {
                console.error(`Failed to sync document id ${doc.id}:`, err);
            }
        }
        console.log("Finished uploading docs");
        // --- SYNC METADATA ---
        const unsyncedMeta =
            await db.execute(`SELECT * FROM metadata WHERE synced = 0`);

        for (const meta of unsyncedMeta.rows) {
            try {
                let floatArray: number[] = [];

                if (meta.embedding && meta.embedding instanceof ArrayBuffer) {
                    floatArray = Array.from(new Float32Array(meta.embedding));
                }

                const res = await fetch(`${SERVER_URL}/embed`, {
                    method: 'POST',
                    body: JSON.stringify({
                        id: meta.document_id,
                        embedding: floatArray,
                        description: meta.description,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!res.ok) throw new Error(`Embed update failed with status ${res.status}`);
                await db.execute(`UPDATE metadata SET synced = 1 WHERE id = ${meta.id}`);
            } catch (err) {
                console.error(`Failed to sync metadata id ${meta.id}:`, err);
            }
        }

        console.log('Sync metadata finished');

    } catch (err) {
        console.error('Sync failed:', err);
    }
}
