import { v4 as uuidv4 } from "uuid";
import ChatSession from "../models/chatSession.model.js";
import Session from "../models/session.model.js";
import config from "../../../../../config.js";
import multer from "multer";
import fs from "fs";

import { AzureOpenAI } from "openai";

const storage = multer.memoryStorage();

const upload = multer({ dest: "uploads/" });

export const sendMessage = async (req, res) => {
  const { sessionId } = req.params;
  const { question } = req.query;

  const endpoint = config.AZURE_OPENAI_ENDPOINT;
  const apiKey = config.AZURE_OPENAI_API_KEY;
  const deployment = config.AI_DEPLOYMENT;
  const apiVersion = config.AI_VERSION;

  const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });

  try {
    upload.fields([
      { name: "image", maxCount: 1 },
      { name: "imageType", maxCount: 1 },
    ])(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: "Error uploading image" });
      }

      const imageFile = req?.files?.image ? req?.files?.image[0] : null;
      // console.log(req.body.type)
      const imageType = req?.body?.type;
      const questionText = req.query.question || question;

      if (!questionText && !imageFile) {
        return res.status(400).json({ error: "Question or image is required" });
      }

      let session = await Session.findOne({ sessionId });
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      let chatSession = await ChatSession.findOne({ sessionId });
      const messageId = uuidv4();

      if (!chatSession) {
        chatSession = new ChatSession({
          sessionId,
          messages: [],
        });
      }

      let messages = [
        {
          role: "system",
          content: `
            You are a highly intelligent AI assistant designed to help users find accurate and relevant information. 
            Please follow these guidelines when responding:
            
            1. **Clarity**: Provide clear and concise answers to the user's questions.
            2. **Markdown Formatting**: Use Markdown for your responses. Format your answers without escaping any characters. 
               - Use # for main headings and ## for subheadings.
               - Use - or * for bullet points.
               - Use numbered lists with numbers followed by a period.
               - For code snippets, use triple backticks (\`\`\`) before and after the code.
            3. **Examples**: Include examples when explaining concepts.
          `,
        },
      ];

      chatSession.messages.forEach((msg) => {
        messages.push({ role: "user", content: msg.data[0].text });
        messages.push({
          role: "assistant",
          content: msg.data[0].answer[0].text,
        });
      });

      // Add user question if available
      if (questionText) {
        messages.push({ role: "user", content: questionText });
      }

      let uploadedFiles = []; // Define an array to hold objects for uploaded files

      if (imageFile) {
        const imageBuffer = fs.readFileSync(imageFile.path);
        const imageBase64 = imageBuffer.toString("base64"); // Store the Base64 string
        // console.log(imageBase64);

        // Create an object for the uploaded file
        uploadedFiles.push({
          base64: imageBase64,
          type: imageType || "image/jpeg", // Use the provided type or default to 'image/jpeg'
        });

        // Create a message object for the image
        // console.log("imag",`data:${imageType};base64,${imageBase64}`);
        messages.push({
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${imageType};base64,${imageBase64}`, // Use the image's Base64 and type
              },
            },
            {
              type: "text",
              text: "What is in this image?",
            },
          ],
        });

        // Remove the file from the server after processing
        fs.unlinkSync(imageFile.path);
      }

      // Call the Azure OpenAI API
      const result = await client.chat.completions.create({
        messages,
        max_tokens: 800,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop: null,
      });

      const answerText = result.choices[0].message.content;
      const questionId = uuidv4();

      // Prepare the new message with question and answer
      const newMessage = {
        questionId,
        data: [
          {
            questionId,
            messageId,
            text: questionText || "Image question",
            uploadedFiles, // Use uploadedFiles directly
            answer: [
              {
                answerId: uuidv4(),
                feedback: null,
                messageId,
                text: answerText,
                questionId: String(questionId),
              },
            ],
          },
        ],
      };
      console.log(newMessage.data[0].uploadedFiles);
      // Push the new message into the chat session and save
      chatSession.messages.push(newMessage);
      await chatSession.save();

      // Return the response
      return res.status(200).json({
        sessionId: chatSession.sessionId,
        messageId,
        uploadedFiles: newMessage.data[0].uploadedFiles, // Return the uploaded files
        messages: chatSession.messages,
      });
    });
  } catch (error) {
    console.error("Error in chat completion:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// export const regenerateMessage = async (req, res) => {
//   const { messageId, sessionId } = req.params;
//   console.log("messageId", messageId);

//   const endpoint = config.AZURE_OPENAI_ENDPOINT;
//   const apiKey = config.AZURE_OPENAI_API_KEY;
//   const apiVersion = "2024-05-01-preview";
//   const deployment = "gpt-35-turbo-16k";

//   const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });

//   try {
//     // Find the chat session that contains the message with the provided messageId
//     let chatSession = await ChatSession.findOne({
//       "messages.data.messageId": messageId,
//     });
//     // console.log("chatsession", chatSession);

//     if (!chatSession) {
//       return res.status(404).json({ error: "Message not found" });
//     }

//     // Initialize variables to hold the found message
//     let foundMessage = null;
//     let foundData = null;

//     // Loop through the messages and data array to find the correct messageId
//     chatSession.messages.forEach((msg) => {
//       msg.data.forEach((dataItem) => {
//         if (dataItem.messageId === messageId) {
//           foundMessage = msg;
//           foundData = dataItem;
//         }
//       });
//     });

//     if (!foundData) {
//       return res.status(404).json({ error: "Message not found" });
//     }

//     // Use Azure OpenAI API to regenerate the response
//     const result = await client.chat.completions.create({
//       messages: [
//         {
//           role: "system",
//           content: `
//           You are a highly capable AI assistant focused on delivering detailed, well-rounded responses.

// Please regenerate the answer for the following question. Aim to provide a more nuanced or alternative perspective that adds depth to the original response. Focus on clarifying any complex points, offering additional examples, or exploring different angles that may not have been previously covered.

// Question: ${foundData.text}

// Strive to enhance the user's understanding by including real-world applications or contrasting viewpoints, where appropriate. Ensure the response is clear and informative, addressing potential gaps or overlooked aspects from the initial answer.

//         `,
//         },
//       ],
//       max_tokens: 800,
//       temperature: 0.7,
//       top_p: 0.95,
//       frequency_penalty: 0,
//       presence_penalty: 0,
//       stop: null,
//     });
//     console.log("result",result.choices[0].message);

//     const regeneratedText = result.choices[0].message.content;

//     // Create a new answer object
//     const newAnswer = {
//       answerId: uuidv4(),
//       feedback: null, // You can modify this based on your requirements
//       messageId,
//       text: regeneratedText,
//       questionId: foundData.questionId,
//     };

//     // Push the new answer to the message's answer array
//     foundData.answer.push(newAnswer);

//     // Save the updated chat session
//     await chatSession.save();

//     // Prepare the response in the desired format
//     const responsePayload = {
//       sessionId: chatSession.sessionId,
//       messageId: foundData.messageId,
//       messages: [
//         {
//           questionId: parseInt(foundMessage.questionId),
//           createdAt: foundMessage.createdAt.toISOString(),
//           messageId: foundMessage.data[0].messageId,
//           data: [
//             {
//               questionId: foundData.questionId,
//               messageId: foundData.messageId,
//               text: foundData.text,
//               answer: foundData.answer.map((ans) => ({
//                 answerId: ans.answerId,
//                 feedback: ans.feedback,
//                 messageId: ans.messageId,
//                 text: ans.text,
//                 questionId: ans.questionId,
//               })),
//             },
//           ],
//         },
//       ],
//     };

//     return res.status(200).json(responsePayload);
//   } catch (error) {
//     console.error("Error regenerating message:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const regenerateMessage = async (req, res) => {
//   const { messageId } = req.params;
//   console.log("messageId", messageId);

//   const endpoint = config.AZURE_OPENAI_ENDPOINT;
//   const apiKey = config.AZURE_OPENAI_API_KEY;
//   const apiVersion = "2024-05-01-preview";
//   const deployment = "gpt-35-turbo-16k";

//   const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });

//   try {
//     // Find the chat session that contains the message with the provided messageId

//     // let session = await ChatSession.findOne({sessionId})

//     let chatSession = await ChatSession.findOne({
//       "messages.data.messageId": messageId,
//     });

//     if (!chatSession) {
//       return res.status(404).json({ error: "Message not found" });
//     }

//     // Initialize variables to hold the found message
//     let foundMessage = null;
//     let foundData = null;

//     // Loop through the messages and data array to find the correct messageId
//     chatSession.messages.forEach((msg) => {
//       msg.data.forEach((dataItem) => {
//         if (dataItem.messageId === messageId) {
//           foundMessage = msg;
//           foundData = dataItem;
//         }
//       });
//     });

//     if (!foundData) {
//       return res.status(404).json({ error: "Message not found" });
//     }

//     // Prepare messages for context (just like in sendMessage)
//     let messages = [
//       {
//         role: "system",
//         content:
//           `You are a highly intelligent AI assistant designed to help users find accurate and relevant information.
//           Please follow these guidelines when responding:

//           1. **Clarity**: Provide clear and concise answers to the user's questions.
//           2. **Markdown Formatting**: Use Markdown for your responses.
//              - Use # for main headings and ## for subheadings.
//              - Use bullet points and code snippets when needed.`
//         ,
//       },
//     ];

//     chatSession.messages.forEach((msg) => {
//       messages.push({ role: "user", content: msg.data[0].text });
//       messages.push({ role: "assistant", content: msg.data[0].answer[0].text });
//     });

//     messages.push({ role: "user", content: foundData.text });

//     // Use Azure OpenAI API to regenerate the response with full context
//     const result = await client.chat.completions.create({
//       messages,
//       max_tokens: 800,
//       temperature: 0.7,
//       top_p: 0.95,
//       frequency_penalty: 0,
//       presence_penalty: 0,
//       stop: null,
//     });

//     const regeneratedText = result.choices[0].message.content;

//     // Create a new answer object for the regenerated response
//     const newAnswer = {
//       answerId: uuidv4(),
//       feedback: null,
//       messageId,
//       text: regeneratedText,
//       questionId: foundData.questionId,
//     };

//     // Push the new answer to the message's answer array
//     foundData.answer.push(newAnswer);

//     // Save the updated chat session with the new regenerated response
//     await chatSession.save();

//     // Prepare the response payload to send back
//     const responsePayload = {
//       sessionId: chatSession.sessionId,
//       messageId: foundData.messageId,
//       messages: [
//         {
//           questionId: parseInt(foundMessage.questionId),
//           createdAt: foundMessage.createdAt.toISOString(),
//           messageId: foundMessage.data[0].messageId,
//           data: [
//             {
//               questionId: foundData.questionId,
//               messageId: foundData.messageId,
//               text: foundData.text,
//               answer: foundData.answer.map((ans) => ({
//                 answerId: ans.answerId,
//                 feedback: ans.feedback,
//                 messageId: ans.messageId,
//                 text: ans.text,
//                 questionId: ans.questionId,
//               })),
//             },
//           ],
//         },
//       ],
//     };

//     return res.status(200).json(responsePayload);
//   } catch (error) {
//     console.error("Error regenerating message:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

export const regenerateMessage = async (req, res) => {
  const { sessionId, messageId } = req.params; 
  console.log("sessionId:", sessionId, "messageId:", messageId);

  const endpoint = config.AZURE_OPENAI_ENDPOINT;
  const apiKey = config.AZURE_OPENAI_API_KEY;
  const apiVersion = config.AI_VERSION;

  const deployment = config.AI_DEPLOYMENT;

  const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });

  try {
    // Find the chat session using the sessionId
    let chatSession = await ChatSession.findOne({ sessionId });

    if (!chatSession) {
      return res.status(404).json({ error: "Session not found" });
    }
    // console.log(chatSession)
    // Initialize variables to hold the found message and data
    let foundMessage = null;
    let foundData = null;
    let imageBase64 = null;
    let imageType = null;
    // Iterate through the messages array to find the message containing the given messageId
  //  let selectedAnswer=messageId.data.answer.length
  //  log("ans",selectedAnswer)
 let ans=0
    chatSession.messages.forEach((msg) => {
      msg.data.forEach((dataItem) => {
        if (dataItem.messageId === messageId) {
console.log("daaat item",dataItem.answer);

          dataItem.selectedAnswer = dataItem.answer.length;
          ans=dataItem.selectedAnswer;
          ans=ans+1
          console.log("Answer array length:", ans); // Log the length for debugging

          if (dataItem.uploadedFiles.length) {
            imageBase64 = dataItem.uploadedFiles[0].base64;
            imageType = dataItem.uploadedFiles[0].type;
          }
          foundMessage = msg;
          foundData = dataItem;
        }
      });
    });



    // console.log(imageBase64, imageType)
    if (!foundData) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Prepare the chat context for the AI model, similar to the sendMessage logic
    let messages = [
      {
        role: "system",
        content: `You are a highly intelligent AI assistant designed to help users find accurate and relevant information. 
          Please follow these guidelines when responding:

          1. **Clarity**: Provide clear and concise answers to the user's questions.
          2. **Markdown Formatting**: Use Markdown for your responses. 
             - Use # for main headings and ## for subheadings.
             - Use bullet points and code snippets when needed.
          3. **Regenerate Response**: Generate a response which is different from the previous response you given.`,
      },
    ];

    // Add previous conversation history to the messages array for context
    chatSession.messages.forEach((msg) => {
      messages.push({ role: "user", content: msg.data[0].text });
      messages.push({ role: "assistant", content: msg.data[0].answer[0].text });
    });

    // Add the specific user message for which we are regenerating the response
    messages.push({ role: "user", content: foundData.text });

    if(imageBase64!==null && imageType!==null) {

    messages.push({
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:${imageType};base64,${imageBase64}`, // Use the image's Base64 and type
          },
        },
        {
          type: "text",
          text: "What is in this image?",
        },
      ],
    });
  }
    // Use Azure OpenAI API to regenerate the response with the full context
    const result = await client.chat.completions.create({
      messages,
      max_tokens: 800,
      temperature: 0.7,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: null,
    });

    const regeneratedText = result.choices[0].message.content;

    // Create a new answer object for the regenerated response
    const newAnswer = {
      answerId: uuidv4(),
      feedback: null,
      messageId,
      text: regeneratedText,
      questionId: foundData.questionId,
    };

    // Push the new answer to the message's answer array
    foundData.answer.push(newAnswer);

    // Save the updated chat session with the new regenerated response
    await chatSession.save();

    // Prepare the response payload to send back
    const responsePayload = {
      sessionId: chatSession.sessionId,
      messageId: foundData.messageId,
      messages: [
        {
          questionId: parseInt(foundMessage.questionId),
          createdAt: foundMessage.createdAt.toISOString(),
          messageId: foundMessage.data[0].messageId,
          
          data: [
            {
              questionId: foundData.questionId,
              messageId: foundData.messageId,
              text: foundData.text,
              selectedAnswer:ans,
              answer: foundData.answer.map((ans) => ({
                answerId: ans.answerId,
                feedback: ans.feedback,
                messageId: ans.messageId,
                text: ans.text,
                questionId: ans.questionId,
              })),
            },
          ],
        },
      ],
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Error regenerating message:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const submitFeedback = async (req, res) => {
  const { messageId, answerId } = req.params;
  const { feedback } = req.query;
  //   console.log(messageId);

  try {
    let chatSession = await ChatSession.findOne({
      "messages.messageId": messageId,
    });

    // console.log(chatSession);

    if (!chatSession) {
      return res.status(404).json({ error: "Message not found" });
    }

    let message = chatSession.messages.find(
      (msg) => msg.messageId === messageId
    );

    // console.log(message);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    let answer = message.answer.find((ans) => ans.answerId === answerId);

    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    answer.feedBack = feedback === "good" ? true : false;
    await chatSession.save();

    return res.status(200).json({
      answerId: answer.answerId,
      feedback: answer.feedback,
      messageId: answer.messageId,
      text: answer.text,
      questionId: answer.questionId,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateSessionTitle = async (req, res) => {
  // console.log("fun calling");

  const { sessionId } = req.params; // Extract sessionId from request params
  // console.log("sessionid val",sessionId);
  const endpoint = config.AZURE_OPENAI_ENDPOINT;
  const apiKey = config.AZURE_OPENAI_API_KEY;
  // console.log("db details",endpoint);
  const apiVersion = "2024-05-01-preview";
  const deployment = "gpt-35-turbo-16k";

  // Initialize Azure OpenAI client
  const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });

  try {
    // Fetch the chat session by sessionId
    const chatSession = await ChatSession.findOne({ sessionId });
    // console.log("chatsession",chatSession);

    if (
      !chatSession ||
      !chatSession.messages ||
      chatSession.messages.length === 0
    ) {
      return res
        .status(404)
        .json({ error: "No messages found for this session." });
    }

    // Get the first message from the chat session
    const firstMessage = chatSession.messages[0];

    if (!firstMessage || !firstMessage.data || firstMessage.data.length === 0) {
      return res
        .status(400)
        .json({ error: "No question data found in the first message." });
    }
    // console.log("data",firstMessage.data[0]);

    // Extract the first question and first answer
    const firstQuestion = firstMessage.data[0].text;
    const firstAnswer = firstMessage.data[0].answer[0].text; // Assuming the answer is always present
    // console.log("firstques",firstQuestion);
    // console.log("firstanss",firstAnswer);

    if (!firstQuestion || !firstAnswer) {
      return res
        .status(400)
        .json({ error: "Question or answer is missing in the first message." });
    }

    const messages = [
      {
        role: "system",
        content: `You are a helpful assistant. your task is to generate an optimal 4-5 words title for the text provided:\n\n${firstAnswer}. Remove double quotes and provide the response`,
      },
    ];

    const result = await client.chat.completions.create({
      messages,
      max_tokens: 800,
      temperature: 0.7,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: null,
    });

    // Summarize the entire answer into 4-5 words
    const title = result.choices[0].message.content;
    const newTitle = title.replace(/"/g, "");
    console.log("newtitle", newTitle);
    // Update the session's title with the summarized answer
    const session = await Session.findOneAndUpdate(
      { sessionId },
      { title: newTitle }, // Update the title field
      { new: true } // Return the updated session
    );
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    // Respond with the updated session
    return res.status(200).json({
      message: "Title updated successfully!",
      session,
    });
  } catch (error) {
    console.error("Error updating session title:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const updateSelectedAnswer = async (req, res) => {
  const { sessionId, messageId, direction } = req.params;

  try {
    // Find the chat session with the given sessionId
    let chatSession = await ChatSession.findOne({ sessionId });
    
    if (!chatSession) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    // Find the message with the given messageId
    let foundMessage = null;
    chatSession.messages.forEach((msg) => {
      msg.data.forEach((dataItem) => {
        if (dataItem.messageId === messageId) {
          foundMessage = dataItem;
        }
      });
    });

    if (!foundMessage) {
      return res.status(404).json({ error: "Message not found" });
    }
console.log("fopundmsg",foundMessage);

    // Decrement selectedAnswer value if direction is -1
    if (direction === "-1") {
      foundMessage.selectedAnswer = Math.max(1, foundMessage.selectedAnswer - 1); 
    await chatSession.save();
return res.status(200).json({message:"updated"})
    }
    else if(direction === '1'){
      foundMessage.selectedAnswer = Math.min(foundMessage.answer.length, foundMessage.selectedAnswer +1); 
      await chatSession.save();
  return res.status(200).json({message:"updated"})
    } else {
      return res.status(400).json({ error: "Invalid direction value" });
    }

 



  } catch (error) {
    console.error("Error updating selected answer:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
