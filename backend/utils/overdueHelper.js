import Task from '../models/Task.js';

export const checkAndUpdateOverdueTasks = async () => {
  try {
    const currentDate = new Date();
    // Count tasks where dueDate < current date and status is not Completed or Cancelled
    const overdueCount = await Task.countDocuments({
      dueDate: { $lt: currentDate },
      status: { $nin: ['Completed', 'Cancelled'] }
    });
    console.log(`[Task Monitor] Checked task deadlines: ${overdueCount} task(s) currently overdue.`);
  } catch (error) {
    console.error('Error checking overdue tasks:', error.message);
  }
};
