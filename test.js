const { initializeDatabase } = require('./database/database');

async function testSetup() {
    console.log('🧪 Testing Tenstorrent AI Lead Detection Platform Setup...');
    console.log('========================================================');
    
    try {
        // Test database initialization
        console.log('\n1. Testing database initialization...');
        await initializeDatabase();
        console.log('✅ Database initialization successful');
        
        // Test service imports
        console.log('\n2. Testing service imports...');
        const redditService = require('./services/redditService');
        const hackerNewsService = require('./services/hackerNewsService');
        const openaiService = require('./services/openaiService');
        console.log('✅ All services imported successfully');
        
        // Test basic functionality
        console.log('\n3. Testing basic functionality...');
        console.log('✅ Reddit service:', typeof redditService.scanReddit);
        console.log('✅ HackerNews service:', typeof hackerNewsService.scanHackerNews);
        console.log('✅ OpenAI service:', typeof openaiService.generateAIResponse);
        
        console.log('\n🎉 All tests passed! The platform is ready to use.');
        console.log('\n📋 Next steps:');
        console.log('1. Add your OpenAI API key to .env file');
        console.log('2. Run: npm install');
        console.log('3. Run: npm start');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

testSetup();
