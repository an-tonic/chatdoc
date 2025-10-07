import {DB} from "@op-engineering/op-sqlite";

export const executeSQL = async (db:DB, sql: string) => {
    try {
        const result = await db.execute(sql);
        console.log('SQL result:', result.rows);
    } catch (err) {
        console.error('SQL error:', err);
    }
};
