const PostView = require("../../models/postView.model");
const User = require("../../models/user.model");
const Post = require("../../models/post.model");

exports.createPostView = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.postId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const [user, post, alreadyViewed] = await Promise.all([
      User.findOne({ _id: req.query.userId }).select("_id isBlock").lean(),
      Post.findOne({ _id: req.query.postId }).select("_id userId").lean(),
      PostView.findOne({ userId: req.query.userId, postId: req.query.postId }),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!post) {
      return res.status(200).json({ status: false, message: "post does not found." });
    }

    res.status(200).json({ status: true, message: "Post view recorded." });

    if (!alreadyViewed) {
      const postView = new PostView();
      postView.userId = user._id;
      postView.postId = post._id;
      postView.postUserId = post?.userId;
      await postView.save();
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
