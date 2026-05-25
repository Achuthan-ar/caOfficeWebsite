import mongoose from 'mongoose';

const blogCommentSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide comment content'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    isApproved: {
      type: Boolean,
      default: true, // Automatically approved for demo simplicity
    },
  },
  {
    timestamps: true,
  }
);

const BlogComment = mongoose.model('BlogComment', blogCommentSchema);
export default BlogComment;
