import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'test@zest.app' }});
  if (!user) {
    console.log('User test@zest.app not found!');
    return;
  }
  
  const match = await bcrypt.compare('Test1234!', user.password);
  console.log('Password match for Test1234!:', match);
}

main().catch(console.error).finally(() => prisma.$disconnect());
