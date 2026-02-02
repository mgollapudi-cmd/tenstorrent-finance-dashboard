const { initializeDatabase } = require('./database/database');

async function setup() {
    console.log('🚀 Setting up Tenstorrent AI Lead Detection Platform...');
    
    try {
        // Initialize database
        await initializeDatabase();
        console.log('✅ Database initialized successfully');
        
        console.log('\n🎉 Setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Copy .env.template to .env and add your OpenAI API key');
        console.log('2. Run: npm install');
        console.log('3. Run: npm start');
        console.log('\n🌐 The platform will be available at http://localhost:3000');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

setup();
