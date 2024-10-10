import { v4 as uuidv4 } from "uuid";
import Session from "../models/session.model.js";
import { StatusCodes } from "http-status-codes";
import ChatSession from "../models/chatSession.model.js";
import config from "../../../../../config.js";


export const createSession = async (req, res) => {
  try {
    const sessionId = uuidv4();
    const { userId, title } = req.body;

    if (!userId || !title) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("UserId and title are required");
    }

    const newSession = new Session({
      sessionId,
      userId,
      title,
    });

    await newSession.save();

    res.status(StatusCodes.OK).send({
      sessionId: newSession.sessionId,
      sharable: newSession.sharable,
      isDeleted: newSession.isDeleted,
      userId: newSession.userId,
      title: newSession.title,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("Error creating session");
  }
};


export const getSessionHistory = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const chatSession = await ChatSession.findOne({ sessionId });

    if (!chatSession) {
      return res.status(404).json({ error: "Session not found" });
    }

    return res.status(200).json({
      sessionId: chatSession.sessionId,
      messages: chatSession.messages,
    });
  } catch (error) {
    console.error("Error fetching session history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteSession = async (req, res) => {
  const {sessionId} = req.query;
  try {
    const session = await Session.findOneAndDelete({ sessionId });

    // If the session is not found, return an error
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Also delete the chat session associated with the session
    await ChatSession.findOneAndDelete({ sessionId });

    return res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const createShareableSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.sharable = true;
    await session.save();
    const baseUrl = config.BASE_URL;
    const shareableUrl = `${baseUrl}/session/share/${sessionId}`;

    return res.status(200).json({
      message: "Session is now shareable",
      shareableUrl,
    });
  } catch (error) {
    console.error("Error creating shareable session:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const getAllSessionsByUser = async (req, res) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit) || 10;  // Default limit is 10
  const skip = parseInt(req.query.skip) || 0;     // Default skip is 0 (no skipping)

  try {
    // Find all sessions for the given userId with pagination
    const sessions = await Session.find({ userId, isDeleted: false })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const totalSessions = await Session.countDocuments({ userId, isDeleted: false });

    return res.status(200).json({
      totalSessions,
      sessions,
      limit,
      skip,
    });
  } catch (error) {
    console.error("Error retrieving sessions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateSession = async (req, res) => {
    const { sessionId } = req.params;  // sessionId passed as a parameter
    const { newTitle } = req.body;     // newTitle passed in the request body

    try {
      // Check if newTitle is provided
      if (!newTitle) {
        return res.status(400).json({ error: "New title is required" });
      }

      // Find the session by sessionId
      let session = await Session.findOne({ sessionId });

      // If session not found, return error
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Update the session title
      session.title = newTitle;

      // Save the updated session
      await session.save();

      // Return the updated session details
      return res.status(200).json({
        message: "Session title updated successfully",
        session,
      });
  }catch (error) {
    console.error("Error retrieving sessions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}


export const getTitleHistory = async (req,res) => {
  const { userId } = req.query;
  // console.log(userId);
  
  try {
    const sessions = await Session.find({ userId }).sort({ createdAt: -1 });

    if (sessions.length === 0) {
      return res.status(200).json({ message: 'No sessions found for the given userId' });
    }

    // Extract sessionId and title from each session
    const sessionData = sessions.map(session => {
      const dateOnly = new Date(session.createdAt).toISOString();
      return {
        sessionId: session.sessionId,
        title: session.title,
        createdAt: dateOnly,
      }
    });

    return res.status(200).json(sessionData);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteDuplicate = async (req,res) => {
  try {
    const { sessionId, messageId } = req.query;
    console.log(sessionId, messageId )
    const sessions = await ChatSession.find({ sessionId });
    console.log(sessions);
    const sessionToDelete = sessions.find(session => session.messages[0].data[0].messageId !== messageId);
    console.log("HEllo-------------------------",sessionToDelete)
    if (sessionToDelete) {
      await ChatSession.findOneAndDelete({ _id: sessionToDelete._id });
      return res.status(200).json({ message: 'Duplicate session without messageId deleted' });
    }
    return res.status(200).json({ message: 'No session found without the given messageId' });
  }catch(err){
    console.error('Error fetching sessions:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

