const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // 1. Create Users
  const password = await bcrypt.hash('password123', 10);
  
  const pm = await prisma.user.upsert({
    where: { email: 'pm@example.com' },
    update: {},
    create: { email: 'pm@example.com', password, name: 'Programme Manager', role: 'PROGRAMME_MANAGER' }
  });

  const institution = await prisma.user.upsert({
    where: { email: 'inst@example.com' },
    update: {},
    create: { email: 'inst@example.com', password, name: 'ABC University', role: 'INSTITUTION' }
  });

  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@example.com' },
    update: {},
    create: { email: 'trainer@example.com', password, name: 'John Trainer', role: 'TRAINER', institution_id: institution.id }
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: { email: 'student@example.com', password, name: 'Alice Student', role: 'STUDENT' }
  });

  const mo = await prisma.user.upsert({
    where: { email: 'mo@example.com' },
    update: {},
    create: { email: 'mo@example.com', password, name: 'Monitoring Officer', role: 'MONITORING_OFFICER', institution_id: institution.id }
  });

  // 2. Create Batch
  const batch = await prisma.batch.create({
    data: {
      name: 'Batch Oct 2024',
      institution_id: institution.id,
      trainers: { create: { trainer_id: trainer.id } },
      students: { create: { student_id: student.id } }
    }
  });

  // 3. Create Session
  const session = await prisma.session.create({
    data: {
      batch_id: batch.id,
      trainer_id: trainer.id,
      title: 'Intro to React',
      date: new Date(),
      start_time: '10:00 AM',
      end_time: '12:00 PM'
    }
  });

  // 4. Create Notification
  await prisma.notification.create({
    data: {
      user_id: student.id,
      title: 'Welcome!',
      message: 'Welcome to the platform, Alice!'
    }
  });

  // 5. Create Mark
  await prisma.mark.create({
    data: {
      student_id: student.id,
      batch_id: batch.id,
      exam_title: 'React Basics Quiz',
      score: 95
    }
  });

  console.log('✅ Seeding complete!');
  console.log('Credentials:');
  console.log('PM: pm@example.com / password123');
  console.log('Inst: inst@example.com / password123');
  console.log('Trainer: trainer@example.com / password123');
  console.log('Student: student@example.com / password123');
  console.log('MO: mo@example.com / password123');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
