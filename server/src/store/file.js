import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export async function fileStore(file) {
  let data = { users: [] };
  try {
    data = JSON.parse(await fs.readFile(file, "utf8"));
  } catch {}
  let writing = Promise.resolve();
  const save = () => {
    writing = writing.then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(data, null, 2));
    });
    return writing;
  };
  const clone = (u) => (u ? structuredClone(u) : null);

  return {
    async findByEmail(email) {
      return clone(data.users.find((u) => u.email === email));
    },
    async findById(id) {
      return clone(data.users.find((u) => u.id === id));
    },
    async create(u) {
      const user = { ...u, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      data.users.push(user);
      await save();
      return clone(user);
    },
    async update(id, patch) {
      const i = data.users.findIndex((u) => u.id === id);
      if (i < 0) return null;
      data.users[i] = { ...data.users[i], ...patch };
      await save();
      return clone(data.users[i]);
    },
  };
}
