const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const readline = require("readline");
require("dotenv").config();

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const generateDisplayId = async (type, role) => {
  const prefixMap = {
    'STUDENT': 'STSB-',
    'TRAINER': 'TRSB-',
    'INSTITUTION': 'INSB-',
    'MONITORING_OFFICER': 'MOSB-',
    'PROGRAMME_MANAGER': 'PMSB-',
    'BATCH': 'BTSB-',
    'ADMIN': 'ADSB-'
  };

  const prefix = type === 'BATCH' ? 'BTSB-' : (prefixMap[role] || 'USSB-');
  
  let nextNumber = 1;
  
  while (true) {
    const candidateId = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    
    let existingId;
    if (type === 'BATCH') {
      existingId = await prisma.batch.findUnique({ where: { displayId: candidateId } });
    } else {
      existingId = await prisma.user.findUnique({ where: { displayId: candidateId } });
    }
    
    if (!existingId) {
      return candidateId;
    }
    
    nextNumber++;
  }
};

async function createProgrammeManager() {
  console.log("--- Create Programme Manager ---");
  
  try {
    const name = await question("Enter Name: ");
    const email = await question("Enter Email: ");
    const password = await question("Enter Password: ");

    if (!name || !email || !password) {
      console.error("Error: Name, Email, and Password are required.");
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error(`Error: User with email ${email} already exists.`);
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate displayId
    const displayId = await generateDisplayId("USER", "PROGRAMME_MANAGER");

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "PROGRAMME_MANAGER",
        displayId,
      },
    });

    console.log("\nSuccess! Programme Manager created:");
    console.log(`ID: ${user.id}`);
    console.log(`Display ID: ${user.displayId}`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);

  } catch (error) {
    console.error("An error occurred:", error.message);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createProgrammeManager();
