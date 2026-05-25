import mongoose from 'mongoose';

const taskCommentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment: {
      type: String,
      required: [true, 'Please provide comment text'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const TaskComment = mongoose.model('TaskComment', taskCommentSchema);
export default TaskComment;
