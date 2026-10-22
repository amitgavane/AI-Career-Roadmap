import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Load environment variables from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import connectDB from '../src/config/db.js';
import SkillTaxonomy from '../src/models/SkillTaxonomy.js';
import JobRole from '../src/models/JobRole.js';
import { initialSkills } from './taxonomyData.js';
import { initialJobRoles } from './jobRolesData.js';

const seedDatabase = async () => {
  console.log('\n=============================================================');
  console.log('       AI CAREER ROADMAP - DATABASE SEEDING (PHASE 2)        ');
  console.log('=============================================================\n');

  try {
    const conn = await connectDB();
    if (!conn) {
      throw new Error('Database connection could not be established. Ensure MongoDB is running.');
    }

    console.log('[1/4] Connected to MongoDB. Clearing previous taxonomy and roles...');
    await SkillTaxonomy.deleteMany({});
    await JobRole.deleteMany({});
    console.log('      ✓ Cleared existing SkillTaxonomy & JobRole collections.\n');

    console.log(`[2/4] Seeding ${initialSkills.length} canonical skills with aliases and categories...`);
    const insertedSkills = await SkillTaxonomy.insertMany(initialSkills);
    console.log(`      ✓ Successfully seeded ${insertedSkills.length} skills in SkillTaxonomy collection.\n`);

    // Build lookup map for fast skillId resolution: canonicalName -> _id
    const skillMap = new Map();
    insertedSkills.forEach((skill) => {
      skillMap.set(skill.canonicalName.toLowerCase(), skill._id);
    });

    console.log(`[3/4] Linking skills and seeding ${initialJobRoles.length} standard job roles...`);
    const enrichedRoles = initialJobRoles.map((role) => {
      // Map required skills with their taxonomy ObjectId reference
      const requiredSkills = role.requiredSkills.map((reqSkill) => {
        const skillId = skillMap.get(reqSkill.canonicalName.toLowerCase()) || null;
        return {
          ...reqSkill,
          skillId,
        };
      });

      // Map optional skills
      const optionalSkills = role.optionalSkills.map((optSkill) => {
        const skillId = skillMap.get(optSkill.canonicalName.toLowerCase()) || null;
        return {
          ...optSkill,
          skillId,
        };
      });

      return {
        ...role,
        requiredSkills,
        optionalSkills,
      };
    });

    const insertedRoles = await JobRole.insertMany(enrichedRoles);
    console.log(`      ✓ Successfully seeded ${insertedRoles.length} Job Roles in JobRole collection.\n`);

    console.log('[4/4] Verifying Seeded Collections & Counts:');
    const skillCount = await SkillTaxonomy.countDocuments();
    const roleCount = await JobRole.countDocuments();

    console.log(`      • Total SkillTaxonomy entries: ${skillCount}`);
    console.log(`      • Total JobRole entries:       ${roleCount}`);

    console.log('\n  Seeded Job Roles:');
    insertedRoles.forEach((role, idx) => {
      console.log(`    ${idx + 1}. ${role.title} (${role.requiredSkills.length} required skills)`);
    });

    console.log('\n=============================================================');
    console.log('       DATABASE SEEDING COMPLETED SUCCESSFULLY!              ');
    console.log('=============================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n[Database Seeding Error]:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedDatabase();
