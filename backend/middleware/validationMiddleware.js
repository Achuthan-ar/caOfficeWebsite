import mongoose from 'mongoose';

// Helper to validate email format
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Main schema validator middleware creator
export const validateSchema = (schema) => {
  return (req, res, next) => {
    const errors = {};

    for (const field in schema) {
      const rules = schema[field];
      const value = req.body[field];

      // 1. Required Check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`;
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        // 2. Email format validation
        if (rules.type === 'email' && !isValidEmail(value)) {
          errors[field] = 'Please provide a valid email address.';
        }

        // 3. String min/max length check
        if (rules.type === 'string') {
          if (rules.min && value.length < rules.min) {
            errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${rules.min} characters.`;
          }
          if (rules.max && value.length > rules.max) {
            errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} cannot exceed ${rules.max} characters.`;
          }
        }

        // 4. Date validation
        if (rules.type === 'date') {
          const dateVal = new Date(value);
          if (isNaN(dateVal.getTime())) {
            errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be a valid date.`;
          } else if (rules.futureOnly && dateVal.setHours(23, 59, 59, 999) < new Date().setHours(0, 0, 0, 0)) {
            errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be a future date.`;
          }
        }

        // 5. Enum validation
        if (rules.enum && !rules.enum.includes(value)) {
          errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be one of: ${rules.enum.join(', ')}.`;
        }

        // 6. MongoId validation
        if (rules.type === 'mongoId' && !mongoose.Types.ObjectId.isValid(value)) {
          errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be a valid ID.`;
        }
      }
    }

    // Custom multi-field checks (e.g. startDate <= endDate)
    if (schema.startDate && schema.endDate && req.body.startDate && req.body.endDate) {
      const start = new Date(req.body.startDate);
      const end = new Date(req.body.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
        errors.endDate = 'End date cannot be before start date.';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

// Schema declarations
export const loginSchema = {
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string' }
};

export const registerSchema = {
  name: { required: true, type: 'string', min: 2, max: 50 },
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string', min: 6 }
};

export const leaveSchema = {
  leaveType: { required: true, type: 'string', enum: ['Casual Leave', 'Sick Leave', 'Emergency Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave'] },
  startDate: { required: true, type: 'date' },
  endDate: { required: true, type: 'date' },
  reason: { required: true, type: 'string', min: 5, max: 500 }
};

export const taskSchema = {
  title: { required: true, type: 'string', min: 3, max: 100 },
  priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
  dueDate: { required: true, type: 'date', futureOnly: true },
  assignedTo: { type: 'mongoId' },
  department: { type: 'mongoId' }
};

export const blogSchema = {
  title: { required: true, type: 'string', min: 5, max: 150 },
  excerpt: { required: true, type: 'string', min: 10, max: 300 },
  content: { required: true, type: 'string', min: 20 }
};
