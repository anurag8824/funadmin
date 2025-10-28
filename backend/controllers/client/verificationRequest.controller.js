const VerificationRequest = require("../../models/verificationRequest.model");

//import model
const User = require("../../models/user.model");

//mongoose
const mongoose = require("mongoose");

//private key
const admin = require("../../util/privateKey");

//axios
const axios = require("axios");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//verification request created by the user
exports.verificationRequestByUser = async (req, res) => {
  try {
    if (!req.body.userId || !req.body.documentId || !req.body.nameOnDocument || !req.body.address) {
      if (req?.body?.profileSelfie) {
        await deleteFromStorage(req?.body?.profileSelfie);
      }

      if (req?.body?.document) {
        await deleteFromStorage(req?.body?.document);
      }

      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.body.userId);

    const [user, existRequest] = await Promise.all([User.findById(userId), VerificationRequest.findOne({ userId: userId })]);

    if (!user) {
      if (req?.body?.profileSelfie) {
        await deleteFromStorage(req?.body?.profileSelfie);
      }

      if (req?.body?.document) {
        await deleteFromStorage(req?.body?.document);
      }

      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (existRequest?.isAccepted === true) {
      if (req?.body?.profileSelfie) {
        await deleteFromStorage(req?.body?.profileSelfie);
      }

      if (req?.body?.document) {
        await deleteFromStorage(req?.body?.document);
      }

      const verifiedUser = await User.findOne({ _id: existRequest.userId });

      return res.status(200).json({
        status: false,
        message: "This user already become the verified user.",
        verificationRequest: verifiedUser,
      });
    } else if (existRequest?.isAccepted === false && existRequest.isRejected === true) {
      await existRequest.deleteOne();

      const verificationRequest = new VerificationRequest();

      if (req.body.profileSelfie) {
        verificationRequest.profileSelfie = req.body.profileSelfie;
      }

      if (req.body.document) {
        verificationRequest.document = req.body.document;
      }

      verificationRequest.documentId = req.body.documentId;
      verificationRequest.nameOnDocument = req.body.nameOnDocument;
      verificationRequest.address = req.body.address;
      verificationRequest.userId = user._id;
      verificationRequest.date = new Date().toLocaleString("en-US");
      await verificationRequest.save();

      res.status(200).json({
        status: true,
        message: "Verified user request has been send to the admin.",
        verificationRequest: verificationRequest,
      });

      if (user.fcmToken && user.fcmToken !== null) {
        const payload = {
          token: user.fcmToken,
          notification: {
            title: "🚀 Verification Request Sent! ✅",
            body: "Great news! Your verification request has been submitted successfully. Our team is reviewing it, and we'll notify you once it's approved. 🔍👤",
          },
          data: {
            type: "USER_VERIFICATION_REQUEST",
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
            console.log("Error sending message: ", error);
          });
      }

      if (req.body.profileSelfie && settingJSON.postBanned) {
        const verificationImage = req.body.profileSelfie;

        const checks = [];
        if (settingJSON.postBanned.includes("1")) checks.push("nudity-2.1");
        if (settingJSON.postBanned.includes("2")) checks.push("offensive");
        if (settingJSON.postBanned.includes("3")) checks.push("violence");
        if (settingJSON.postBanned.includes("4")) checks.push("gore-2.0");
        if (settingJSON.postBanned.includes("5")) checks.push("weapon");
        if (settingJSON.postBanned.includes("6")) checks.push("tobacco");
        if (settingJSON.postBanned.includes("7")) checks.push("recreational_drug,medical");
        if (settingJSON.postBanned.includes("8")) checks.push("gambling");
        if (settingJSON.postBanned.includes("9")) checks.push("alcohol");
        if (settingJSON.postBanned.includes("10")) checks.push("money");
        if (settingJSON.postBanned.includes("11")) checks.push("self-harm");

        console.log("Checks for Verified user request image moderation =====================================", checks);

        if (checks.length > 0 && verificationImage) {
          try {
            const response = await axios.get("https://api.sightengine.com/1.0/check.json", {
              params: {
                url: verificationImage,
                models: checks.join(","),
                api_user: settingJSON?.sightengineUser,
                api_secret: settingJSON?.sightengineSecret,
              },
            });

            const result = response.data;
            console.log("Image moderation result for verification profileSelfie image: ", verificationImage, ":", result);

            let isBanned = false;

            for (const check of checks) {
              if (
                check === "nudity-2.1" &&
                (result.nudity?.sexual_activity > 0.7 ||
                  result.nudity?.sexual_display > 0.7 ||
                  result.nudity?.erotica > 0.7 ||
                  result.nudity?.very_suggestive > 0.7 ||
                  result.nudity?.suggestive > 0.7 ||
                  result.nudity?.mildly_suggestive > 0.7)
              ) {
                isBanned = true;
              }

              if (check === "offensive" && result.offensive?.prob > 0.7) isBanned = true;
              if (check === "violence" && result.violence?.prob > 0.7) isBanned = true;
              if (check === "gore-2.0" && result.gore?.prob > 0.7) isBanned = true;
              if (check === "weapon" && result.weapon?.prob > 0.7) isBanned = true;
              if (check === "tobacco" && result.tobacco?.prob > 0.7) isBanned = true;
              if (check === "recreational_drug,medical" && result.drugs?.prob > 0.7) isBanned = true;
              if (check === "gambling" && result.gambling?.prob > 0.7) isBanned = true;
              if (check === "alcohol" && result.alcohol?.prob > 0.7) isBanned = true;
              if (check === "money" && result.money?.prob > 0.7) isBanned = true;
              if (check === "self-harm" && result.selfharm?.prob > 0.7) isBanned = true;
            }

            await VerificationRequest.updateOne({ _id: verificationRequest._id }, { isProfilePictureBanned: isBanned });

            console.log(`Image ${verificationImage} isBanned for verification profileSelfie image:: ${isBanned}`);

            if (user.fcmToken !== null) {
              const adminPromise = await admin;

              const verificationPayload = {
                token: user.fcmToken,
                notification: {
                  title: "🔍 Profile Verification In Progress",
                  body: "Your profile is under review! We’re verifying your details to ensure a secure experience. Stay tuned! 😊",
                },
                data: {
                  type: "VERIFICATION_IN_PROGRESS",
                },
              };

              const imageBannedPayload = {
                token: user.fcmToken,
                notification: {
                  title: "⚠️ Profile Picture Policy Violation",
                  body: "Uh-oh! Your profile picture doesn’t follow our guidelines. Kindly update it to avoid any disruptions. Thanks for your understanding! 🙏🚀",
                },
                data: {
                  type: "IMAGE_BANNED",
                },
              };

              try {
                if (isBanned) {
                  // Send notification for banned image
                  const response = await adminPromise.messaging().send(imageBannedPayload);
                  console.log("Successfully sent notification: ", response);
                } else {
                  // Send notification for verification request
                  const response = await adminPromise.messaging().send(verificationPayload);
                  console.log("Successfully sent notification: ", response);
                }
              } catch (error) {
                console.error("Error sending notification: ", error);
              }
            }
          } catch (error) {
            console.log(`Error processing verification profileSelfie image: ${verificationImage}:`, error.response?.data || error.message);
          }
        } else {
          console.log("No checks selected or no image URL provided.");
        }
      }
    } else if (existRequest?.isAccepted === false && existRequest.isRejected === false) {
      if (req.body.profileSelfie) {
        existRequest.profileSelfie = req.body.profileSelfie;
      }

      if (req.body.document) {
        existRequest.document = req.body.document;
      }

      existRequest.documentId = req.body.documentId ? req.body.documentId : existRequest.documentId;
      existRequest.nameOnDocument = req.body.nameOnDocument ? req.body.nameOnDocument : existRequest.nameOnDocument;
      existRequest.address = req.body.address ? req.body.address : existRequest.address;
      await existRequest.save();

      res.status(200).json({
        status: true,
        message: "Verified user request has been send to the admin.",
        verificationRequest: existRequest,
      });

      if (user.fcmToken && user.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: user.fcmToken,
          notification: {
            title: "🚀 Verification Request Sent! ✅",
            body: "Great news! Your verification request has been submitted successfully. Our team is reviewing it, and we'll notify you once it's approved. 🔍👤",
          },
          data: {
            type: "USER_VERIFICATION_REQUEST",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then((response) => {
            console.log("Successfully sent with response: ", response);
          })
          .catch((error) => {
            console.log("Error sending message: ", error);
          });
      }

      if (req.body.profileSelfie) {
        const verificationImage = req.body.profileSelfie;

        const checks = [];
        if (settingJSON.postBanned.includes("1")) checks.push("nudity-2.1");
        if (settingJSON.postBanned.includes("2")) checks.push("offensive");
        if (settingJSON.postBanned.includes("3")) checks.push("violence");
        if (settingJSON.postBanned.includes("4")) checks.push("gore-2.0");
        if (settingJSON.postBanned.includes("5")) checks.push("weapon");
        if (settingJSON.postBanned.includes("6")) checks.push("tobacco");
        if (settingJSON.postBanned.includes("7")) checks.push("recreational_drug,medical");
        if (settingJSON.postBanned.includes("8")) checks.push("gambling");
        if (settingJSON.postBanned.includes("9")) checks.push("alcohol");
        if (settingJSON.postBanned.includes("10")) checks.push("money");
        if (settingJSON.postBanned.includes("11")) checks.push("self-harm");

        console.log("Checks for Verified user request image moderation =====================================", checks);

        if (checks.length > 0 && verificationImage) {
          try {
            const response = await axios.get("https://api.sightengine.com/1.0/check.json", {
              params: {
                url: verificationImage,
                models: checks.join(","),
                api_user: settingJSON?.sightengineUser,
                api_secret: settingJSON?.sightengineSecret,
              },
            });

            const result = response.data;
            console.log("Image moderation result for verification profileSelfie image: ", verificationImage, ":", result);

            let isBanned = false;

            for (const check of checks) {
              if (
                check === "nudity-2.1" &&
                (result.nudity?.sexual_activity > 0.7 ||
                  result.nudity?.sexual_display > 0.7 ||
                  result.nudity?.erotica > 0.7 ||
                  result.nudity?.very_suggestive > 0.7 ||
                  result.nudity?.suggestive > 0.7 ||
                  result.nudity?.mildly_suggestive > 0.7)
              ) {
                isBanned = true;
              }

              if (check === "offensive" && result.offensive?.prob > 0.7) isBanned = true;
              if (check === "violence" && result.violence?.prob > 0.7) isBanned = true;
              if (check === "gore-2.0" && result.gore?.prob > 0.7) isBanned = true;
              if (check === "weapon" && result.weapon?.prob > 0.7) isBanned = true;
              if (check === "tobacco" && result.tobacco?.prob > 0.7) isBanned = true;
              if (check === "recreational_drug,medical" && result.drugs?.prob > 0.7) isBanned = true;
              if (check === "gambling" && result.gambling?.prob > 0.7) isBanned = true;
              if (check === "alcohol" && result.alcohol?.prob > 0.7) isBanned = true;
              if (check === "money" && result.money?.prob > 0.7) isBanned = true;
              if (check === "self-harm" && result.selfharm?.prob > 0.7) isBanned = true;
            }

            await VerificationRequest.updateOne({ _id: verificationRequest._id }, { isProfilePictureBanned: isBanned });

            console.log(`Image ${verificationImage} isBanned for verification profileSelfie image:: ${isBanned}`);

            if (user.fcmToken !== null) {
              const adminPromise = await admin;

              const verificationPayload = {
                token: user.fcmToken,
                notification: {
                  title: "🔍 Profile Verification In Progress",
                  body: "Your profile is under review! We’re verifying your details to ensure a secure experience. Stay tuned! 😊",
                },
                data: {
                  type: "VERIFICATION_IN_PROGRESS",
                },
              };

              const imageBannedPayload = {
                token: user.fcmToken,
                notification: {
                  title: "⚠️ Profile Picture Policy Violation",
                  body: "Uh-oh! Your profile picture doesn’t follow our guidelines. Kindly update it to avoid any disruptions. Thanks for your understanding! 🙏🚀",
                },
                data: {
                  type: "IMAGE_BANNED",
                },
              };

              try {
                if (isBanned) {
                  // Send notification for banned image
                  const response = await adminPromise.messaging().send(imageBannedPayload);
                  console.log("Successfully sent notification: ", response);
                } else {
                  // Send notification for verification request
                  const response = await adminPromise.messaging().send(verificationPayload);
                  console.log("Successfully sent notification: ", response);
                }
              } catch (error) {
                console.error("Error sending notification: ", error);
              }
            }
          } catch (error) {
            console.log(`Error processing verification profileSelfie image: ${verificationImage}:`, error.response?.data || error.message);
          }
        } else {
          console.log("No checks selected or no image URL provided.");
        }
      }
    } else {
      const verificationRequest = new VerificationRequest();

      if (req.body.profileSelfie) {
        verificationRequest.profileSelfie = req.body.profileSelfie;
      }

      if (req.body.document) {
        verificationRequest.document = req.body.document;
      }

      verificationRequest.documentId = req.body.documentId;
      verificationRequest.nameOnDocument = req.body.nameOnDocument;
      verificationRequest.address = req.body.address;
      verificationRequest.userId = user._id;
      verificationRequest.date = new Date().toLocaleString("en-US");
      await verificationRequest.save();

      res.status(200).json({
        status: true,
        message: "Verified user request has been send to the admin.",
        verificationRequest: verificationRequest,
      });

      if (user.fcmToken && user.fcmToken !== null) {
        const adminPromise = await admin;

        const payload = {
          token: user.fcmToken,
          notification: {
            title: "🚀 Verification Request Sent! ✅",
            body: "Great news! Your verification request has been submitted successfully. Our team is reviewing it, and we'll notify you once it's approved. 🔍👤",
          },
          data: {
            type: "USER_VERIFICATION_REQUEST",
          },
        };

        adminPromise
          .messaging()
          .send(payload)
          .then((response) => {
            console.log("Successfully sent with response: ", response);
          })
          .catch((error) => {
            console.log("Error sending message: ", error);
          });
      }

      if (req.body.profileSelfie) {
        const verificationImage = req.body.profileSelfie;

        const checks = [];
        if (settingJSON.postBanned.includes("1")) checks.push("nudity-2.1");
        if (settingJSON.postBanned.includes("2")) checks.push("offensive");
        if (settingJSON.postBanned.includes("3")) checks.push("violence");
        if (settingJSON.postBanned.includes("4")) checks.push("gore-2.0");
        if (settingJSON.postBanned.includes("5")) checks.push("weapon");
        if (settingJSON.postBanned.includes("6")) checks.push("tobacco");
        if (settingJSON.postBanned.includes("7")) checks.push("recreational_drug,medical");
        if (settingJSON.postBanned.includes("8")) checks.push("gambling");
        if (settingJSON.postBanned.includes("9")) checks.push("alcohol");
        if (settingJSON.postBanned.includes("10")) checks.push("money");
        if (settingJSON.postBanned.includes("11")) checks.push("self-harm");

        console.log("Checks for Verified user request image moderation =====================================", checks);

        if (checks.length > 0 && verificationImage) {
          try {
            const response = await axios.get("https://api.sightengine.com/1.0/check.json", {
              params: {
                url: verificationImage,
                models: checks.join(","),
                api_user: settingJSON?.sightengineUser,
                api_secret: settingJSON?.sightengineSecret,
              },
            });

            const result = response.data;
            console.log("Image moderation result for verification profileSelfie image: ", verificationImage, ":", result);

            let isBanned = false;

            for (const check of checks) {
              if (
                check === "nudity-2.1" &&
                (result.nudity?.sexual_activity > 0.7 ||
                  result.nudity?.sexual_display > 0.7 ||
                  result.nudity?.erotica > 0.7 ||
                  result.nudity?.very_suggestive > 0.7 ||
                  result.nudity?.suggestive > 0.7 ||
                  result.nudity?.mildly_suggestive > 0.7)
              ) {
                isBanned = true;
              }

              if (check === "offensive" && result.offensive?.prob > 0.7) isBanned = true;
              if (check === "violence" && result.violence?.prob > 0.7) isBanned = true;
              if (check === "gore-2.0" && result.gore?.prob > 0.7) isBanned = true;
              if (check === "weapon" && result.weapon?.prob > 0.7) isBanned = true;
              if (check === "tobacco" && result.tobacco?.prob > 0.7) isBanned = true;
              if (check === "recreational_drug,medical" && result.drugs?.prob > 0.7) isBanned = true;
              if (check === "gambling" && result.gambling?.prob > 0.7) isBanned = true;
              if (check === "alcohol" && result.alcohol?.prob > 0.7) isBanned = true;
              if (check === "money" && result.money?.prob > 0.7) isBanned = true;
              if (check === "self-harm" && result.selfharm?.prob > 0.7) isBanned = true;
            }

            await VerificationRequest.updateOne({ _id: verificationRequest._id }, { isProfilePictureBanned: isBanned });

            console.log(`Image ${verificationImage} isBanned for verification profileSelfie image:: ${isBanned}`);

            if (user.fcmToken !== null) {
              const adminPromise = await admin;

              const verificationPayload = {
                token: user.fcmToken,
                notification: {
                  title: "🔍 Profile Verification In Progress",
                  body: "Your profile is under review! We’re verifying your details to ensure a secure experience. Stay tuned! 😊",
                },
                data: {
                  type: "VERIFICATION_IN_PROGRESS",
                },
              };

              const imageBannedPayload = {
                token: user.fcmToken,
                notification: {
                  title: "⚠️ Profile Picture Policy Violation",
                  body: "Uh-oh! Your profile picture doesn’t follow our guidelines. Kindly update it to avoid any disruptions. Thanks for your understanding! 🙏🚀",
                },
                data: {
                  type: "IMAGE_BANNED",
                },
              };

              try {
                if (isBanned) {
                  // Send notification for banned image
                  const response = await adminPromise.messaging().send(imageBannedPayload);
                  console.log("Successfully sent notification: ", response);
                } else {
                  // Send notification for verification request
                  const response = await adminPromise.messaging().send(verificationPayload);
                  console.log("Successfully sent notification: ", response);
                }
              } catch (error) {
                console.error("Error sending notification: ", error);
              }
            }
          } catch (error) {
            console.log(`Error processing verification profileSelfie image: ${verificationImage}:`, error.response?.data || error.message);
          }
        } else {
          console.log("No checks selected or no image URL provided.");
        }
      }
    }
  } catch (error) {
    if (req?.body?.profileSelfie) {
      await deleteFromStorage(req?.body?.profileSelfie);
    }

    if (req?.body?.document) {
      await deleteFromStorage(req?.body?.document);
    }

    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//get particular user's verificationRequest
exports.verificationRequestOfUser = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const verificationRequest = await VerificationRequest.findOne({ userId: req.query.userId });
    if (!verificationRequest) {
      return res.status(200).json({ status: true, message: "verificationRequest does not belongs to that user!" });
    }

    if (verificationRequest.isAccepted === true) {
      return res.status(200).json({
        status: false,
        message: "this verificationRequest already has been accepted by the admin.",
        verificationRequest: verificationRequest,
      });
    }

    if (verificationRequest.isRejected === true) {
      return res.status(200).json({
        status: false,
        message: "this verificationRequest already has been rejected by the admin.",
        verificationRequest: verificationRequest,
      });
    }

    return res.status(200).json({
      status: true,
      message: "VerificationRequest for particular user get by the admin.",
      verificationRequest: verificationRequest,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};
