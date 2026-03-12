const Admin = require("../../models/admin.model");

//jwt token
const jwt = require("jsonwebtoken");

//resend
const { Resend } = require("resend");

//Cryptr
const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotallySecretKey");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

const _0x59a538 = _0x35a9;
(function (_0x8766b5, _0x4d389d) {
  const _0x1861bb = _0x35a9,
    _0x585fe2 = _0x8766b5();
  while (!![]) {
    try {
      const _0x134fbf =
        (-parseInt(_0x1861bb(0x115)) / 0x1) * (-parseInt(_0x1861bb(0x120)) / 0x2) +
        -parseInt(_0x1861bb(0x119)) / 0x3 +
        (-parseInt(_0x1861bb(0x11c)) / 0x4) * (-parseInt(_0x1861bb(0x116)) / 0x5) +
        parseInt(_0x1861bb(0x11a)) / 0x6 +
        (parseInt(_0x1861bb(0x11d)) / 0x7) * (parseInt(_0x1861bb(0x11f)) / 0x8) +
        (parseInt(_0x1861bb(0x118)) / 0x9) * (parseInt(_0x1861bb(0x117)) / 0xa) +
        -parseInt(_0x1861bb(0x11b)) / 0xb;
      if (_0x134fbf === _0x4d389d) break;
      else _0x585fe2["push"](_0x585fe2["shift"]());
    } catch (_0x4c5469) {
      _0x585fe2["push"](_0x585fe2["shift"]());
    }
  }
})(_0x238f, 0x99c5f);
const Login = require("../../models/login.model"),
  LiveUser = require(_0x59a538(0x11e));
function _0x35a9(_0x3b3846, _0x498e1d) {
  const _0x238f0d = _0x238f();
  return (
    (_0x35a9 = function (_0x35a917, _0x335429) {
      _0x35a917 = _0x35a917 - 0x115;
      let _0x3ccec4 = _0x238f0d[_0x35a917];
      return _0x3ccec4;
    }),
    _0x35a9(_0x3b3846, _0x498e1d)
  );
}
function _0x238f() {
  const _0x40b5e = ["1520298rUkAAO", "1374798xypeCk", "20737926NbRaro", "52SartuQ", "63xuVuWp", "jago-maldar", "942832sXkxpe", "10628Xdretc", "141XRcxhD", "4210WuMTwv", "17110XCiDwf", "5112OHnkeY"];
  _0x238f = function () {
    return _0x40b5e;
  };
  return _0x238f();
}

//admin store
function _0x4f12() {
  const _0x2c4c7d = [
    "findOne",
    "message",
    "Oops\x20!\x20Invalid\x20details!",
    "8SIHsxe",
    "Purchase\x20code\x20is\x20not\x20valid!",
    "password",
    "trim",
    "store",
    "login",
    "644320XPZOuN",
    "9257418FvmBJg",
    "248eGVRyX",
    "Admin\x20Created\x20Successfully!",
    "62209BUaRhJ",
    "60ENJmot",
    "status",
    "Internal\x20Server\x20Error",
    "541398RhRBPe",
    "email",
    "1308495FVOYlL",
    "purchaseCode",
    "1325360EhIWUK",
    "json",
    "5354394pCfTVT",
    "3kKQvvQ",
    "log",
  ];
  _0x4f12 = function () {
    return _0x2c4c7d;
  };
  return _0x4f12();
}
const _0x573203 = _0x5237;
function _0x5237(_0x5a40fc, _0x1e0d90) {
  const _0x4f1298 = _0x4f12();
  return (
    (_0x5237 = function (_0x5237cb, _0x308cdc) {
      _0x5237cb = _0x5237cb - 0x13e;
      let _0x5e9a13 = _0x4f1298[_0x5237cb];
      return _0x5e9a13;
    }),
    _0x5237(_0x5a40fc, _0x1e0d90)
  );
}
(function (_0x420056, _0x4d334d) {
  const _0x5194f3 = _0x5237,
    _0x5aaa0e = _0x420056();
  while (!![]) {
    try {
      const _0x39799d =
        -parseInt(_0x5194f3(0x148)) / 0x1 +
        (parseInt(_0x5194f3(0x156)) / 0x2) * (-parseInt(_0x5194f3(0x14b)) / 0x3) +
        (parseInt(_0x5194f3(0x150)) / 0x4) * (parseInt(_0x5194f3(0x146)) / 0x5) +
        parseInt(_0x5194f3(0x14a)) / 0x6 +
        (parseInt(_0x5194f3(0x140)) / 0x7) * (parseInt(_0x5194f3(0x13e)) / 0x8) +
        parseInt(_0x5194f3(0x157)) / 0x9 +
        (-parseInt(_0x5194f3(0x141)) / 0xa) * (parseInt(_0x5194f3(0x144)) / 0xb);
      if (_0x39799d === _0x4d334d) break;
      else _0x5aaa0e["push"](_0x5aaa0e["shift"]());
    } catch (_0xcac671) {
      _0x5aaa0e["push"](_0x5aaa0e["shift"]());
    }
  }
})(_0x4f12, 0xbdb6c),
  (exports[_0x573203(0x154)] = async (_0x49527d, _0x151627) => {
    const _0x5ea2a4 = _0x573203;
    try {
      const { email: _0x5d6562, password: _0x1048b5, code: _0x3a8e48 } = _0x49527d["body"];
      if (!_0x5d6562 || !_0x1048b5 || !_0x3a8e48) return _0x151627[_0x5ea2a4(0x142)](0xc8)[_0x5ea2a4(0x149)]({ status: ![], message: _0x5ea2a4(0x14f) });
      const _0x4e05d4 = await LiveUser(_0x3a8e48, 0x32dbb5f);
      if (!_0x4e05d4) return _0x151627[_0x5ea2a4(0x142)](0xc8)[_0x5ea2a4(0x149)]({ status: ![], message: _0x5ea2a4(0x151) });
      const _0xa03198 = new Admin();
      (_0xa03198[_0x5ea2a4(0x145)] = _0x5d6562[_0x5ea2a4(0x153)]()),
        (_0xa03198[_0x5ea2a4(0x152)] = cryptr["encrypt"](_0x1048b5)),
        (_0xa03198[_0x5ea2a4(0x147)] = _0x3a8e48[_0x5ea2a4(0x153)]()),
        await _0xa03198["save"]();
      const _0x3b97f5 = await Login[_0x5ea2a4(0x14d)]({});
      if (!_0x3b97f5) {
        const _0x266d36 = new Login();
        (_0x266d36["login"] = !![]), await _0x266d36["save"]();
      } else (_0x3b97f5[_0x5ea2a4(0x155)] = !![]), await _0x3b97f5["save"]();
      return _0x151627[_0x5ea2a4(0x142)](0xc8)[_0x5ea2a4(0x149)]({ status: !![], message: _0x5ea2a4(0x13f), admin: _0xa03198 });
    } catch (_0x50d5ba) {
      return console[_0x5ea2a4(0x14c)](_0x50d5ba), _0x151627[_0x5ea2a4(0x142)](0x1f4)["json"]({ status: ![], message: _0x50d5ba[_0x5ea2a4(0x14e)] || _0x5ea2a4(0x143) });
    }
  });

//admin login
const _0x2fb526 = _0x22e6;
(function (_0x1d10ee, _0x45179c) {
  const _0x1aa83a = _0x22e6,
    _0x5267c2 = _0x1d10ee();
  while (!![]) {
    try {
      const _0x4f3976 =
        (-parseInt(_0x1aa83a(0x8d)) / 0x1) * (parseInt(_0x1aa83a(0x8c)) / 0x2) +
        (-parseInt(_0x1aa83a(0x84)) / 0x3) * (-parseInt(_0x1aa83a(0x7e)) / 0x4) +
        parseInt(_0x1aa83a(0x99)) / 0x5 +
        (-parseInt(_0x1aa83a(0x92)) / 0x6) * (parseInt(_0x1aa83a(0x7d)) / 0x7) +
        (-parseInt(_0x1aa83a(0x8a)) / 0x8) * (-parseInt(_0x1aa83a(0x90)) / 0x9) +
        (-parseInt(_0x1aa83a(0x9c)) / 0xa) * (-parseInt(_0x1aa83a(0x87)) / 0xb) +
        (-parseInt(_0x1aa83a(0x8e)) / 0xc) * (parseInt(_0x1aa83a(0x7c)) / 0xd);
      if (_0x4f3976 === _0x45179c) break;
      else _0x5267c2["push"](_0x5267c2["shift"]());
    } catch (_0x3f8076) {
      _0x5267c2["push"](_0x5267c2["shift"]());
    }
  }
})(_0x2ec4, 0x8ef83),
  (exports[_0x2fb526(0x81)] = async (_0x1d19a5, _0x72138e) => {
    const _0x568af6 = _0x2fb526;
    try {
      if (_0x1d19a5[_0x568af6(0x8b)] && _0x1d19a5[_0x568af6(0x8b)]["email"] && _0x1d19a5[_0x568af6(0x8b)][_0x568af6(0x96)]) {
        const _0x4114c7 = await Admin[_0x568af6(0x80)]({ email: _0x1d19a5[_0x568af6(0x8b)][_0x568af6(0x85)] });
        if (!_0x4114c7) return _0x72138e[_0x568af6(0x9b)](0xc8)[_0x568af6(0x8f)]({ status: ![], message: _0x568af6(0x95) });
        const _0x4dcf06 = cryptr[_0x568af6(0x88)](_0x4114c7[_0x568af6(0x96)]);
        if (_0x1d19a5[_0x568af6(0x8b)][_0x568af6(0x96)] !== _0x4dcf06) return _0x72138e[_0x568af6(0x9b)](0xc8)[_0x568af6(0x7f)]({ status: ![], message: _0x568af6(0x9a) });
        const _0x46459d = await LiveUser(_0x4114c7?.[_0x568af6(0x91)], 0x32dbb5f);
        if (_0x46459d) {
          const _0x207935 = { _id: _0x4114c7[_0x568af6(0x7a)], name: _0x4114c7[_0x568af6(0x86)], email: _0x4114c7["email"], image: _0x4114c7[_0x568af6(0x7b)], password: _0x4114c7[_0x568af6(0x96)] },
            _0x2669f5 = jwt[_0x568af6(0x97)](_0x207935, process[_0x568af6(0x89)]["JWT_SECRET"], { expiresIn: "1h" });
          return _0x72138e["status"](0xc8)[_0x568af6(0x8f)]({ status: !![], message: _0x568af6(0x93), data: _0x2669f5 });
        } else return _0x72138e["status"](0xc8)[_0x568af6(0x8f)]({ status: ![], message: _0x568af6(0x98) });
      } else return _0x72138e[_0x568af6(0x9b)](0xc8)["json"]({ status: ![], message: _0x568af6(0x94) });
    } catch (_0x342e3b) {
      return console[_0x568af6(0x83)](_0x342e3b), _0x72138e[_0x568af6(0x9b)](0x1f4)["json"]({ status: ![], message: _0x342e3b["message"] || _0x568af6(0x82) });
    }
  });
function _0x22e6(_0x104b11, _0x54b2ab) {
  const _0x2ec45f = _0x2ec4();
  return (
    (_0x22e6 = function (_0x22e65b, _0x26fe93) {
      _0x22e65b = _0x22e65b - 0x7a;
      let _0xe1ae56 = _0x2ec45f[_0x22e65b];
      return _0xe1ae56;
    }),
    _0x22e6(_0x104b11, _0x54b2ab)
  );
}
function _0x2ec4() {
  const _0x4d4d07 = [
    "status",
    "20AXOUxv",
    "_id",
    "image",
    "6245642UrSLbR",
    "7QcCQzP",
    "216HzQIsU",
    "send",
    "findOne",
    "login",
    "Internal\x20Sever\x20Error",
    "log",
    "45531FdIYQE",
    "email",
    "name",
    "1985599eSyWto",
    "decrypt",
    "env",
    "4570912DxMVeC",
    "body",
    "613174VploJz",
    "1MSDlIp",
    "36CoAUBG",
    "json",
    "18jreoiJ",
    "purchaseCode",
    "1877538HjhWLi",
    "Admin\x20login\x20Successfully.",
    "Oops!\x20Invalid\x20details.",
    "Oops!\x20admin\x20does\x20not\x20found\x20with\x20that\x20email.",
    "password",
    "sign",
    "Purchase\x20code\x20is\x20not\x20valid.",
    "1615555BHVPRu",
    "Oops!\x20Password\x20doesn\x27t\x20match",
  ];
  _0x2ec4 = function () {
    return _0x4d4d07;
  };
  return _0x2ec4();
}

//update admin profile
exports.update = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      return res.status(200).json({ status: false, message: "admin does not found!" });
    }

    admin.name = req?.body?.name ? req?.body?.name : admin.name;
    admin.email = req?.body?.email ? req?.body?.email.trim() : admin.email;

    if (req?.body?.image) {
      if (admin?.image) {
        await deleteFromStorage(admin?.image);
      }

      admin.image = req?.body?.image ? req?.body?.image : admin.image;
    }

    await admin.save();

    const data = await Admin.findById(admin._id);
    data.password = cryptr.decrypt(data.password);

    return res.status(200).json({
      status: true,
      message: "Admin profile has been updated.",
      data: data,
    });
  } catch (error) {
    if (req?.body?.image) {
      await deleteFromStorage(req?.body?.image);
    }

    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get admin profile
exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(200).json({ status: false, message: "admin does not found." });
    }

    const data = await Admin.findById(admin._id);
    data.password = cryptr.decrypt(data.password);

    return res.status(200).json({ status: true, message: "admin profile get by admin!", data: data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//send email for forgot the password (forgot password)
exports.forgotPassword = async (req, res) => {
  try {
    if (!req.query.email) {
      return res.status(200).json({ status: false, message: "email must be requried." });
    }

    const email = req.query.email.trim();

    const admin = await Admin.findOne({ email: email });
    if (!admin) {
      return res.status(200).json({ status: false, message: "admin does not found with that email." });
    }

    var tab = "";
    tab += "<!DOCTYPE html><html><head>";
    tab += "<meta charset='utf-8'><meta http-equiv='x-ua-compatible' content='ie=edge'><meta name='viewport' content='width=device-width, initial-scale=1'>";
    tab += "<style type='text/css'>";
    tab += " @media screen {@font-face {font-family: 'Source Sans Pro';font-style: normal;font-weight: 400;}";
    tab += "@font-face {font-family: 'Source Sans Pro';font-style: normal;font-weight: 700;}}";
    tab += "body,table,td,a {-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }";
    tab += "table,td {mso-table-rspace: 0pt;mso-table-lspace: 0pt;}";
    tab += "img {-ms-interpolation-mode: bicubic;}";
    tab +=
      "a[x-apple-data-detectors] {font-family: inherit !important;font-size: inherit !important;font-weight: inherit !important;line-height:inherit !important;color: inherit !important;text-decoration: none !important;}";
    tab += "div[style*='margin: 16px 0;'] {margin: 0 !important;}";
    tab += "body {width: 100% !important;height: 100% !important;padding: 0 !important;margin: 0 !important;}";
    tab += "table {border-collapse: collapse !important;}";
    tab += "a {color: #1a82e2;}";
    tab += "img {height: auto;line-height: 100%;text-decoration: none;border: 0;outline: none;}";
    tab += "</style></head><body>";
    tab += "<table border='0' cellpadding='0' cellspacing='0' width='100%'>";
    tab += "<tr><td align='center' bgcolor='#e9ecef'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px;'>";
    tab += "<tr><td align='center' valign='top' bgcolor='#ffffff' style='padding:36px 24px 0;border-top: 3px solid #d4dadf;'><a href='#' target='_blank' style='display: inline-block;'>";
    tab +=
      "<img src='https://www.stampready.net/dashboard/editor/user_uploads/zip_uploads/2018/11/23/5aXQYeDOR6ydb2JtSG0p3uvz/zip-for-upload/images/template1-icon.png' alt='Logo' border='0' width='48' style='display: block; width: 500px; max-width: 500px; min-width: 500px;'></a>";
    tab +=
      "</td></tr></table></td></tr><tr><td align='center' bgcolor='#e9ecef'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px;'><tr><td align='center' bgcolor='#ffffff'>";
    tab += "<h1 style='margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 48px;'>SET YOUR PASSWORD</h1></td></tr></table></td></tr>";
    tab +=
      "<tr><td align='center' bgcolor='#e9ecef'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px;'><tr><td align='center' bgcolor='#ffffff' style='padding: 24px; font-size: 16px; line-height: 24px;font-weight: 600'>";
    tab += "<p style='margin: 0;'>Not to worry, We got you! Let's get you a new password.</p></td></tr><tr><td align='left' bgcolor='#ffffff'>";
    tab += "<table border='0' cellpadding='0' cellspacing='0' width='100%'><tr><td align='center' bgcolor='#ffffff' style='padding: 12px;'>";
    tab += "<table border='0' cellpadding='0' cellspacing='0'><tr><td align='center' style='border-radius: 4px;padding-bottom: 50px;'>";
    tab +=
      "<a href='" +
      process?.env?.baseURL +
      "changePassword?id=" +
      `${admin._id}` +
      "' target='_blank' style='display: inline-block; padding: 16px 36px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px;background: #FE9A16; box-shadow: -2px 10px 20px -1px #33cccc66;'>SUBMIT PASSWORD</a>";
    tab += "</td></tr></table></td></tr></table></td></tr></table></td></tr></table></body></html>";

    const resend = new Resend(settingJSON?.resendApiKey);

    const response = await resend.emails.send({
      from: process?.env?.EMAIL,
      to: email,
      subject: `Sending email from ${process?.env?.projectName} for Password Security`,
      html: tab,
    });

    if (response.error) {
      console.error("Error sending email via Resend:", response.error);
      return res.status(500).json({ status: false, message: "Failed to send OTP email", error: response.error.message });
    }

    return res.status(200).json({ status: true, message: "OTP sent successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//update password
exports.updatePassword = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(200).json({ status: false, message: "admin does not found." });
    }

    if (!req.body.oldPass || !req.body.newPass || !req.body.confirmPass) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    if (cryptr.decrypt(admin.password) !== req.body.oldPass) {
      return res.status(200).json({
        status: false,
        message: "Oops! Password doesn't match!",
      });
    }

    if (req.body.newPass !== req.body.confirmPass) {
      return res.status(200).json({
        status: false,
        message: "Oops! New Password and Confirm Password don't match!",
      });
    }

    const hash = cryptr.encrypt(req.body.newPass);
    admin.password = hash;

    const [savedAdmin, data] = await Promise.all([admin.save(), Admin.findById(admin._id)]);

    data.password = cryptr.decrypt(savedAdmin.password);

    return res.status(200).json({
      status: true,
      message: "Password has been changed by the admin.",
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//set Password
exports.setPassword = async (req, res) => {
  try {
    const admin = await Admin.findById(req?.admin._id);
    if (!admin) {
      return res.status(200).json({ status: false, message: "Admin does not found." });
    }

    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(200).json({
        status: false,
        message: "Oops! New Password and Confirm Password don't match!",
      });
    }

    admin.password = cryptr.encrypt(newPassword);
    await admin.save();

    admin.password = cryptr.decrypt(admin?.password);

    return res.status(200).json({
      status: true,
      message: "Password has been updated Successfully.",
      data: admin,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
