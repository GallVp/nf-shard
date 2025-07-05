import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function resetWorkspace () {
  await prisma.workspace.deleteMany({})
  return null
}
