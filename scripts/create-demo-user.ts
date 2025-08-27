// Script to create demo user for testing trading notes

import { prisma } from '@/lib/database/prisma-client';

async function createDemoUser() {
  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: 'demo-user-123' }
    });

    if (existingUser) {
      console.log('✅ Demo user already exists:', existingUser.email);
      return;
    }

    // Create demo user
    const demoUser = await prisma.user.create({
      data: {
        id: 'demo-user-123',
        email: 'demo@example.com'
      }
    });

    console.log('✅ Created demo user:', demoUser.email);
  } catch (error) {
    console.error('❌ Error creating demo user:', error);
    throw error;
  }
}

if (require.main === module) {
  createDemoUser()
    .then(() => {
      console.log('🎉 Demo user setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Demo user setup failed:', error);
      process.exit(1);
    });
}