import mongoose from 'mongoose';

const createMasterSchema = (collectionName) => {
  return new mongoose.Schema(
    {
      name: {
        type: String,
        required: [true, 'Please provide name option'],
        trim: true,
        index: true,
      },
      description: {
        type: String,
        trim: true,
      },
      status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
        index: true,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    {
      timestamps: true,
      collection: collectionName,
    }
  );
};

export const ServiceMaster = mongoose.model('ServiceMaster', createMasterSchema('services_master'));
const associateSchema = new mongoose.Schema(
  {
    associate_name: {
      type: String,
      required: [true, 'Please provide associate name'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email address'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    phone_number: {
      type: String,
      required: [true, 'Please provide phone number'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'accountants_master',
  }
);

export const AccountantMaster = mongoose.model('AccountantMaster', associateSchema);
export const ClientTypeMaster = mongoose.model('ClientTypeMaster', createMasterSchema('client_types_master'));
export const CaseTypeMaster = mongoose.model('CaseTypeMaster', createMasterSchema('case_types_master'));
export const RegularityTypeMaster = mongoose.model('RegularityTypeMaster', createMasterSchema('regularity_types_master'));

// Master lookup mapping helper
export const getMasterModel = (category) => {
  const mapping = {
    'services': ServiceMaster,
    'accountants': AccountantMaster,
    'client-types': ClientTypeMaster,
    'case-types': CaseTypeMaster,
    'regularity-types': RegularityTypeMaster,
  };
  return mapping[category.toLowerCase()];
};
