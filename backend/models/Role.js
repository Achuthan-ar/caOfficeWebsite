import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a role name'],
      unique: true,
      trim: true,
      enum: ['Admin', 'Manager', 'TL', 'Employee', 'Intern', 'Client'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Role = mongoose.model('Role', roleSchema);
export default Role;
