require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');

const departments = [
  {
    title: 'Maternity & Delivery',
    desc: 'Normal and caesarean delivery suites, a dedicated labour team, and rooming-in so mother and baby are not separated after birth.',
    order: 1,
  },
  {
    title: 'Neonatal Intensive Care (NICU)',
    desc: 'Level-II NICU for premature and low-weight newborns, staffed around the clock by neonatologists and NICU-trained nurses.',
    order: 2,
  },
  {
    title: 'Paediatrics',
    desc: "Everyday childhood illness, growth monitoring, and a paediatrician on call for anything that can't wait until morning.",
    order: 3,
  },
  {
    title: 'Gynaecology',
    desc: 'Pregnancy care from the first trimester, high-risk pregnancy monitoring, and general women\u2019s health consultations.',
    order: 4,
  },
  {
    title: 'Vaccination & Immunisation',
    desc: 'A tracked schedule from birth through age twelve, with SMS reminders so no dose gets missed.',
    order: 5,
  },
  {
    title: 'Child Nutrition & Growth',
    desc: 'Dietician-led plans for underweight, overweight, or feeding-difficulty cases, reviewed alongside your paediatrician.',
    order: 6,
  },
];

const doctors = [
  {
    initials: 'RS',
    color: '#24443B',
    name: 'Dr. Ritu Sharma',
    role: 'Obstetrics & Gynaecology',
    bio: 'Fifteen years delivering in Alwar, with a focus on high-risk pregnancies and VBAC support.',
    department: 'Gynaecology',
    order: 1,
  },
  {
    initials: 'AK',
    color: '#C97268',
    name: 'Dr. Anil Kapoor',
    role: 'Neonatology, NICU Lead',
    bio: 'Heads the NICU team; trained in newborn intensive care at SMS Medical College, Jaipur.',
    department: 'Neonatal Intensive Care (NICU)',
    order: 2,
  },
  {
    initials: 'SM',
    color: '#C89B3C',
    name: 'Dr. Sonal Mathur',
    role: 'Paediatrics',
    bio: 'Sees children from birth through adolescence, with a particular interest in growth and nutrition.',
    department: 'Paediatrics',
    order: 3,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    await Department.deleteMany({});
    await Doctor.deleteMany({});

    await Department.insertMany(departments);
    await Doctor.insertMany(doctors);

    console.log('Seed data inserted successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
