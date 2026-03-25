import db from "./db.js";
import bcrypt from "bcrypt";

const password = bcrypt.hashSync("admin", 10);

db.prepare(`
INSERT OR IGNORE INTO users (username, password, isAdmin)
VALUES (?, ?, 1)
`).run("admin", password);

console.log("Dodano konto admina: login=admin hasło=admin");
