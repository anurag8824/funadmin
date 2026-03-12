//get a single post by ID (used for deep-link share)
exports.getPostById = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { userId } = req.query;

    if (!postId) {
      return res.status(200).json({ status: false, message: "postId is required." });
    }

    if (!userId) {
      return res.status(200).json({ status: false, message: "userId is required." });
    }

    const Post = require("../../models/post.model");
    const post = await Post.findById(postId)
      .populate("userId", "-password")
      .populate("hashtags")
      .lean();

    if (!post) {
      return res.status(200).json({ status: false, message: "Post not found." });
    }

    return res.status(200).json({
      status: true,
      message: "Post retrieved successfully.",
      post: post,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
