const jwt = require("jsonwebtoken");
const Cryptr = require("cryptr");
const Admin = require("../../models/admin.model");
const Login = require("../../models/login.model");
const PurchaseCode = require("../../models/purchaseCode.model");

const cryptr = new Cryptr("myTotallySecretKey");

async function markLoginEnabled() {
  let loginDoc = await Login.findOne();
  if (!loginDoc) {
    await new Login({ login: true }).save();
    return;
  }
  if (!loginDoc.login) {
    loginDoc.login = true;
    await loginDoc.save();
  }
}

exports.signUp = async (req, res) => {
  try {
    const { email, password, code } = req.body || {};

    if (!email || !password || !code) {
      return res.status(200).json({
        status: false,
        message: "Oops ! Invalid details!",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedCode = String(code).trim();

    const existingAdmin = await Admin.findOne({ email: normalizedEmail });
    if (existingAdmin) {
      return res.status(200).json({
        status: false,
        message: "Admin already exists with this email.",
      });
    }

    const purchaseCodeDoc = await PurchaseCode.findOne({
      code: normalizedCode,
      isActive: true,
      usedAt: null,
    });

    if (!purchaseCodeDoc) {
      return res.status(200).json({
        status: false,
        message: "Purchase code is not valid!",
      });
    }

    const admin = new Admin({
      email: normalizedEmail,
      password: cryptr.encrypt(password),
      purchaseCode: normalizedCode,
      name: "Admin",
    });
    await admin.save();

    purchaseCodeDoc.usedAt = new Date();
    purchaseCodeDoc.usedByEmail = normalizedEmail;
    await purchaseCodeDoc.save();

    await markLoginEnabled();

    return res.status(200).json({
      status: true,
      message: "Admin Created Successfully!",
      admin,
    });
  } catch (error) {
    console.error("admin signUp error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(200).json({
        status: false,
        message: "Oops! Invalid details.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const admin = await Admin.findOne({ email: normalizedEmail });

    if (!admin) {
      return res.status(200).json({
        status: false,
        message: "Oops! admin does not found with that email.",
      });
    }

    const decryptedPassword = cryptr.decrypt(admin.password);
    if (password !== decryptedPassword) {
      return res.status(200).json({
        status: false,
        message: "Oops! Password doesn't match",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        status: false,
        message: "JWT_SECRET is not configured on the server.",
      });
    }

    const token = jwt.sign(
      {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        image: admin.image,
        password: admin.password,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      status: true,
      message: "Admin login Successfully.",
      data: token,
    });
  } catch (error) {
    console.error("admin login error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};
