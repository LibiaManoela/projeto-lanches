import initialUsers from "@/mocks/users.json";

interface MockUser {
  id: number;
  name: string;
  email: string;
  password: string;
}

const globalUsers = globalThis as typeof globalThis & { AplicativoUsers?: MockUser[] };
const users = globalUsers.AplicativoUsers ?? (globalUsers.AplicativoUsers = [...initialUsers]);

export function findUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return users.find((user) => user.email.toLowerCase() === normalizedEmail);
}

export function addUser(name: string, email: string, password: string) {
  const user = {
    id: Math.max(0, ...users.map((existingUser) => existingUser.id)) + 1,
    name,
    email: email.trim().toLowerCase(),
    password,
  };
  users.push(user);
  return user;
}