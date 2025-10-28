const Complaint = require("../../models/complaint.model");
const User = require("../../models/user.model");

//private key
const admin = require("../../util/privateKey");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//get type wise all complaints
exports.getComplaints = async (req, res) => {
  try {
    if (!req.query.status) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    if (!req.query.startDate || !req.query.endDate) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    let dateFilterQuery = {};
    if (req?.query?.startDate !== "All" && req?.query?.endDate !== "All") {
      const startDate = new Date(req?.query?.startDate);
      const endDate = new Date(req?.query?.endDate);
      endDate.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    let statusQuery = {};
    if (req.query.status !== "All") {
      statusQuery.status = parseInt(req.query.status);
    }

    const [totalComplaints, complaint] = await Promise.all([
      Complaint.countDocuments({ ...statusQuery, ...dateFilterQuery }),
      Complaint.aggregate([
        { $match: { ...statusQuery, ...dateFilterQuery } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            "user.isBlock": false,
          },
        },
        {
          $project: {
            complaint: 1,
            contact: 1,
            status: 1,
            image: 1,
            date: 1,
            createdAt: 1,
            isComplaintImageRestricted: 1,
            name: "$user.name",
            userName: "$user.userName",
            userImage: "$user.image",
            uniqueId: "$user.uniqueId",
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit }, //how many records you want to skip
        { $limit: limit },
      ]),
    ]);

    return res.status(200).json({
      status: true,
      message: "Retrive complaints submitted by the user.",
      total: totalComplaints,
      data: complaint.length > 0 ? complaint : [],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//complaint solved
exports.solveComplaint = async (req, res) => {
  try {
    if (!req.query.complaintId) {
      return res.status(200).json({ status: false, message: "complaintId must be requried." });
    }

    const complaint = await Complaint.findById(req.query.complaintId);
    if (!complaint) {
      return res.status(200).json({ status: false, message: "Complaint does not found." });
    }

    if (complaint.status == 2) {
      return res.status(200).json({ status: false, message: "Complaint already solved by the admin." });
    }

    complaint.status = 2;
    await complaint.save();

    res.status(200).send({
      status: true,
      message: "Complaint has been solved by the admin.",
      data: complaint,
    });

    const user = await User.findById(complaint?.userId);

    //checks if the user has an fcmToken
    if (user.fcmToken && user.fcmToken !== null) {
      const payload = {
        token: user.fcmToken,
        notification: {
          title: "🛠️ Complaint Resolved Successfully! ✅",
          body: "We're happy to inform you that your complaint has been resolved. Thank you for your cooperation! 😊",
        },
        data: {
          type: "COMPLAINT_RESOLVED",
        },
      };

      const adminPromise = await admin;
      adminPromise
        .messaging()
        .send(payload)
        .then((response) => {
          console.log("Successfully sent with response: ", response);
        })
        .catch((error) => {
          console.log("Error sending message:      ", error);
        });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//delete complaint
exports.deleteComplaint = async (req, res) => {
  try {
    if (!req.query.complaintId) {
      return res.status(200).json({ status: false, message: "complaintId must be requried." });
    }

    const complaint = await Complaint.findById(req.query.complaintId);
    if (!complaint) {
      return res.status(200).json({ status: false, message: "complaint does not found." });
    }

    if (complaint?.image) {
      await deleteFromStorage(complaint?.image);
    }

    await complaint.deleteOne();

    return res.status(200).json({ status: true, message: "Complaint has been deleted by the admin." });
  } catch {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};
