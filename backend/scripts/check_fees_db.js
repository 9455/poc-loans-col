require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const FeeService = require('../src/models/FeeService');

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dedlyfi_loans');
        console.log('✅ Connected to MongoDB');

        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📂 Collections found:', collections.map(c => c.name));

        // Check FeeService content
        console.log('\n🔎 Content of FeeService:');
        const fees = await FeeService.find({});
        if (fees.length === 0) {
            console.log('   (Empty - No records found)');
        } else {
            fees.forEach(f => {
                console.log(`   - [${f.type}] ${f.name}: ${f.percentage}% -> Recipient: ${f.recipientAddress} (Active: ${f.isActive})`);
            });
        }

    } catch (err) {
        console.error('❌ Error checking DB:', err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

checkDB();
