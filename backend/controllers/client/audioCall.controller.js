const AudioCall = require("../../models/audioCall.model");
const User = require("../../models/user.model");
const { v4: uuidv4 } = require("uuid");

// Create a new audio call
const createAudioCall = async (req, res) => {
  try {
    const { receiverId, callerId } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        status: false,
        message: "Receiver ID is required",
      });
    }

    if (callerId === receiverId) {
      return res.status(400).json({
        status: false,
        message: "Cannot call yourself",
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId).select("_id name userName image fcmToken");
    if (!receiver) {
      return res.status(404).json({
        status: false,
        message: "Receiver not found",
      });
    }

    // Generate unique call ID
    const callId = uuidv4();

    // Create call record
    const audioCall = new AudioCall({
      callerId,
      receiverId,
      callId,
      status: AudioCall.CALL_STATUS.CALLING,
    });

    await audioCall.save();

    // Populate caller info
    const caller = await User.findById(callerId).select("_id name userName image");

    res.status(200).json({
      status: true,
      message: "Call initiated successfully",
      data: {
        callId,
        caller: {
          id: caller._id,
          name: caller.name,
          userName: caller.userName,
          image: caller.image,
        },
        receiver: {
          id: receiver._id,
          name: receiver.name,
          userName: receiver.userName,
          image: receiver.image,
        },
        status: audioCall.status,
        createdAt: audioCall.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating audio call:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update call status
const updateCallStatus = async (req, res) => {
  try {
    const { callId, status, userId } = req.body;

    if (!callId || !status) {
      return res.status(400).json({
        status: false,
        message: "Call ID and status are required",
      });
    }

    const audioCall = await AudioCall.findOne({ callId });

    if (!audioCall) {
      return res.status(404).json({
        status: false,
        message: "Call not found",
      });
    }

    // Verify user is part of the call
    if (audioCall.callerId.toString() !== userId && audioCall.receiverId.toString() !== userId) {
      return res.status(403).json({
        status: false,
        message: "Unauthorized to update this call",
      });
    }

    // Update status
    const updateData = { status };

    if (status === AudioCall.CALL_STATUS.ACCEPTED && !audioCall.startedAt) {
      updateData.startedAt = new Date();
    }

    if (
      [AudioCall.CALL_STATUS.REJECTED, AudioCall.CALL_STATUS.ENDED, AudioCall.CALL_STATUS.MISSED].includes(status)
    ) {
      updateData.endedAt = new Date();
      if (audioCall.startedAt) {
        const duration = Math.floor((new Date() - audioCall.startedAt) / 1000);
        updateData.duration = duration;
      }
    }

    await AudioCall.findByIdAndUpdate(audioCall._id, { $set: updateData });

    res.status(200).json({
      status: true,
      message: "Call status updated successfully",
      data: {
        callId,
        status,
      },
    });
  } catch (error) {
    console.error("Error updating call status:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get call history
const getCallHistory = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const calls = await AudioCall.find({
      $or: [{ callerId: userId }, { receiverId: userId }],
    })
      .populate("callerId", "_id name userName image")
      .populate("receiverId", "_id name userName image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AudioCall.countDocuments({
      $or: [{ callerId: userId }, { receiverId: userId }],
    });

    res.status(200).json({
      status: true,
      message: "Call history retrieved successfully",
      data: {
        calls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching call history:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get call details
const getCallDetails = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.query.userId || req.body.userId;

    const audioCall = await AudioCall.findOne({ callId })
      .populate("callerId", "_id name userName image")
      .populate("receiverId", "_id name userName image");

    if (!audioCall) {
      return res.status(404).json({
        status: false,
        message: "Call not found",
      });
    }

    // Verify user is part of the call
    if (audioCall.callerId._id.toString() !== userId && audioCall.receiverId._id.toString() !== userId) {
      return res.status(403).json({
        status: false,
        message: "Unauthorized to view this call",
      });
    }

    res.status(200).json({
      status: true,
      message: "Call details retrieved successfully",
      data: audioCall,
    });
  } catch (error) {
    console.error("Error fetching call details:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createAudioCall,
  updateCallStatus,
  getCallHistory,
  getCallDetails,
};
