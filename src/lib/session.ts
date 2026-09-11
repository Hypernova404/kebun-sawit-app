import { getDbAsync } from "./db"

export const LOCAL_USER_ID = "local"

export const LOCAL_USER = {
  id: LOCAL_USER_ID,
  name: "Pengguna",
  email: "local@sawitdesk.local",
  image: null,
}

export async function getLocalUserId(): Promise<string> {
  const db = await getDbAsync()
  const existing = await db.user.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  })
  if (existing) return existing.id
  await db.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: {
      id: LOCAL_USER_ID,
      name: LOCAL_USER.name,
      email: LOCAL_USER.email,
      emailVerified: true,
    },
  })
  return LOCAL_USER_ID
}

export async function getLocalUser() {
  const id = await getLocalUserId()
  const db = await getDbAsync()
  const user = await db.user.findUnique({ where: { id } })
  return user ? { id: user.id, name: user.name, email: user.email, image: user.image } : LOCAL_USER
}