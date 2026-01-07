import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clearRateLimits() {
  try {
    const deleted = await prisma.video_explanation_requests.deleteMany({});
    console.log(`✅ Deleted ${deleted.count} rate limit records`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearRateLimits();
