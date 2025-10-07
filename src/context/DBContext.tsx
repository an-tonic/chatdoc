import React, {createContext, useContext, useEffect, useState} from 'react';
import {open, DB} from '@op-engineering/op-sqlite';

type DBContextType = DB | null;

const DBContext = createContext<DBContextType>(null);

export const useDB = () => useContext(DBContext);

export const DBProvider = ({children}: {children: React.ReactNode}) => {
    const [db, setDb] = useState<DBContextType>(null);

    useEffect(() => {
        const setupDB = async () => {
            const instance = open({
                name: 'documents.db',
                location: '../files/databases',
            });
            // @formatter:off
            await instance.execute(`
                CREATE TABLE IF NOT EXISTS documents (
                  id INTEGER PRIMARY KEY,
                  path TEXT UNIQUE NOT NULL,
                  synced INTEGER DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS metadata (
                  id INTEGER PRIMARY KEY,
                  document_id INTEGER NOT NULL,
                  description TEXT,
                  embedding FLOAT[768],
                  synced INTEGER DEFAULT 0,
                  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
                )`
            );

            setDb(instance);
        };

        setupDB();
    }, []);

    if (!db) return null;

    return <DBContext.Provider value={db}>{children}</DBContext.Provider>;
};
