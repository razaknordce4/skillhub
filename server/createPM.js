const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email = args[0] || 'pm_admin@example.com';
  const plainPassword = args[1] || 'password123';
  const name = args[2] || 'Programme Manager';

  console.log(`Creating Programme Manager with email: ${email}...`);

  try {
    const password = await bcrypt.hash(plainPassword, 10);

    // Generate Display ID
    const count = await prisma.user.count({ where: { role: 'PROGRAMME_MANAGER' } });
    const nextNumber = (count + 1).toString().padStart(3, '0');
    const displayId = `PMSB-${nextNumber}`;

    const pm = await prisma.user.upsert({
      where: { email },
      update: {
        password,
        name,
      },
      create: {
        email,
        password,
        name,
        role: 'PROGRAMME_MANAGER',
        displayId
      }
    });

    console.log('  Programme Manager created successfully!');
    console.log('-----------------------------------');
    console.log(`Email:    ${pm.email}`);
    console.log(`Password: ${plainPassword}`);
    console.log(`Name:     ${pm.name}`);
    console.log(`Role:     ${pm.role}`);
    console.log(`ID:       ${pm.displayId}`);
    console.log('-----------------------------------');
  } catch (error) {
    console.error('❌ Error creating Programme Manager:', error.message);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
