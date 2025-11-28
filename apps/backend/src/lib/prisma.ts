const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export async function testDbConnection() {
  try {
    await prisma.$connect()
    return true
  } finally {
    await prisma.$disconnect()
  }
}

export default prisma