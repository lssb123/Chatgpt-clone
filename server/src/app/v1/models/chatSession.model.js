import mongoose from "mongoose";
import fs from "fs"; // Importing fs to handle file operations

const messageSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    selectedQuestion: { type:Number ,default:1},

    data: [
      {
        questionId: { type: String, required: true },
        messageId: { type: String, required: true },
        text: { type: String, required: true },
        selectedAnswer: { type:Number ,default:1},

        uploadedFiles: [
          {
            base64: { type: String, required: true }, 
            type: { type: String, required: true }  
          }
        ],
        answer: [
          {
            answerId: { type: String, required: true },
            feedback: { type: String, default: null },
            messageId: { type: String, required: true },
            text: { type: String, required: true },
            questionId: { type: String, required: true },
          }
        ]
      }
    ],
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  messages: [messageSchema],
});

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

export default ChatSession;