import mongoose from "mongoose";
import logger from "../../../../../logger.js";
import config from "../../../../../config.js";

const DbConfig = {
  uri: config.MONGOURI,
  // uri: "mongodb://localhost:27017/miraAI",
};

const connectDB = (async () => {
  try {
  
    await mongoose.connect(DbConfig.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error("Database connection failed!", error);
    process.exit(1);
  }
})();

export default connectDB;
