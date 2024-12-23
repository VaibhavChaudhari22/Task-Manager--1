const express = require('express');
const Task = require('../models/Task');
const protect = require('../middleware/auth'); // Adding auth middleware to protect routes
const router = express.Router();

// Utility function to check if the task belongs to the logged-in user
const checkTaskOwnership = async (taskId, userId) => {
    const task = await Task.findOne({ _id: taskId, user: userId });
    if (!task) {
        throw new Error('Task not found or unauthorized'); // If task is not found or doesn't belong to the user
    }
    return task;
};

// GET /tasks - Fetch tasks with pagination, filtering by priority, completion, and deadline
router.get('/', protect, async (req, res) => {
    try {
        const { page = 1, limit = 10, priority, completed, filterBy } = req.query;
        const query = { user: req.user.userId };

        // Filter tasks by priority if provided
        if (priority) query.priority = priority;

        // Filter tasks based on whether they're completed or not
        if (completed) query.completed = completed === 'true';

        // Filter tasks by deadline (today or upcoming)
        if (filterBy === 'today') {
            const today = new Date();
            query.deadline = { $gte: today.setHours(0, 0, 0, 0), $lt: today.setHours(23, 59, 59, 999) };
        } else if (filterBy === 'upcoming') {
            query.deadline = { $gte: new Date() };
        }

        // Fetch tasks with pagination
        const tasks = await Task.find(query)
            .skip((page - 1) * limit)  // Skip tasks based on the current page
            .limit(parseInt(limit));  // Limit the number of tasks returned

        // Get total number of tasks for pagination metadata
        const totalTasks = await Task.countDocuments(query);

        // Send tasks and pagination info
        res.status(200).json({
            success: true,
            tasks,
            totalTasks,
            totalPages: Math.ceil(totalTasks / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
    }
});

// GET /tasks/completed - Fetch only completed tasks
router.get('/completed', protect, async (req, res) => {
    try {
        // Fetch completed tasks for the user
        const completedTasks = await Task.find({ user: req.user.userId, completed: true });

        res.status(200).json({ success: true, tasks: completedTasks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch completed tasks', error: error.message });
    }
});

// GET /tasks/:id - Fetch a specific task by its ID
router.get('/:id', protect, async (req, res) => {
    try {
        const task = await checkTaskOwnership(req.params.id, req.user.userId); // Check if the task belongs to the user
        res.status(200).json({ success: true, task });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// POST /tasks - Create a new task
router.post('/', protect, async (req, res) => {
    const { title, description, priority, deadline } = req.body;

    // Validate the required fields
    if (!title || !description || !priority || !deadline) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (new Date(deadline) < new Date()) {
        return res.status(400).json({ message: 'Deadline must be a future date' });
    }

    const task = new Task({
        title,
        description,
        priority,
        deadline,
        user: req.user.userId,
        completed: false  // Initially, tasks are not completed
    });

    try {
        const savedTask = await task.save();
        res.status(201).json({ success: true, task: savedTask });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving the task', error: error.message });
    }
});

// PUT /tasks/:id - Update an existing task
router.put('/:id', protect, async (req, res) => {
    try {
        const taskId = req.params.id;
        const taskData = req.body;

        // Ensure task belongs to the user before updating
        const task = await checkTaskOwnership(taskId, req.user.userId);

        // Validate required fields for task update
        if (!taskData.title || !taskData.description || !taskData.priority || !taskData.deadline) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Update task fields
        task.title = taskData.title || task.title;
        task.description = taskData.description || task.description;
        task.priority = taskData.priority || task.priority;
        task.deadline = taskData.deadline || task.deadline;

        const updatedTask = await task.save();
        res.status(200).json({ success: true, task: updatedTask });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update task', error: error.message });
    }
});

// DELETE /tasks/:id - Delete a task by its ID
router.delete('/:id', protect, async (req, res) => {
    try {
        const task = await checkTaskOwnership(req.params.id, req.user.userId);

        // Delete task from the database
        await Task.findByIdAndDelete(task._id);
        res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: error.message });
    }
});

module.exports = router;
