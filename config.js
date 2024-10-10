import path, { dirname } from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import logger from './logger.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const args = process.argv && process.argv.slice(2);
const env = args && args.length > 0 ? args[0] : 'production';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let config; // Define config variable outside try-catch block

try {
    let dotenvPath
    if (!env)
        dotenvPath = path.resolve(__dirname, '.env'); // If environment is not 'development', use .env.<env>
    else if(env)
        dotenvPath = path.resolve(__dirname, `.env.${env}`);
    // console.log(env)
    // Load environment variables from the specified .env file
    if(env!=="production"){
        const result = dotenv.config({ path: dotenvPath });
        // Check if loading .env file failed
        if (result.error) {
            throw result.error;
        }
    }
    
    // Export environment variables
    config = {
        ENV: env||'production',
        API_KEY: process.env.API_KEY,
        DATABASE_HOST: process.env.DATABASE_HOST,
        DATABASE_USER: process.env.DATABASE_USER,
        DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
        DATABASE_NAME: process.env.DATABASE_NAME,
        AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
        AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
        BASE_URL: process.env.BASE_URL,
        MONGOURI: process.env.MONGOURI,
        HUBBLE_KEY: process.env.HUBBLE_KEY,
        SECRET_KEY: process.env.SECRET_KEY,
        AI_DEPLOYMENT:process.env.AI_DEPLOYMENT,
        AI_VERSION:process.env.AI_VERSION
    };
    // logger.info(config)
} catch (error) {
    console.log(error);
}

export default config; // Export config inside try-catch block
