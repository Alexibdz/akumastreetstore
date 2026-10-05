// Guarda una copia de la base local (data/akuma.db) en demo/akuma.db: es con la que arranca la web en Vercel.
import fs from "node:fs";
import Database from "better-sqlite3";

for (const f of ["akuma.db", "akuma.db-wal", "akuma.db-shm"]) fs.rmSync(`demo/${f}`, { force: true });
fs.mkdirSync("demo", { recursive: true });

const base = new Database("data/akuma.db", { readonly: true });
base.exec("VACUUM INTO 'demo/akuma.db'"); // un solo archivo, con lo que todavía estaba en el -wal
base.close();

console.log("Copia de la base guardada en demo/akuma.db. Subila con git para actualizar la demo.");
