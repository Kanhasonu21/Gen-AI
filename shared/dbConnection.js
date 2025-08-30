import mongoose from 'mongoose';

const connectDB = async (mongoUri = null) => {
    try {
        // Use provided URI or environment variable
        const connectionString = mongoUri || process.env.MONGODB_URI;
        
        if (!connectionString) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`📊 MongoDB connected successfully`);
        console.log(`🔗 Database: ${connectionString.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'}`);
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        console.error('🔧 Connection string being used:', connectionString ? connectionString.substring(0, 30) + '...' : 'undefined');
        throw error; // Let the calling function handle the exit
    }
};

export default connectDB;

