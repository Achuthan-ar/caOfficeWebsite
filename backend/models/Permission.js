import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a permission name'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
  },
  {
    timestamps: true,
  }
);

const Permission = mongoose.model('Permission', permissionSchema);
export default Permission;
