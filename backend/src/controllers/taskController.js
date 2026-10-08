const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

exports.getTasks = async (req, res, next) => {
  try {
    const filter = { ...req.companyFilter };

    if (req.query.search) {
      filter.$or = [{ title: new RegExp(req.query.search, 'i') }];
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.user.role === 'sales_rep') filter.assignedTo = req.user._id;

    if (req.query.startDate || req.query.endDate) {
      filter.dueDate = {};
      if (req.query.startDate) filter.dueDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.dueDate.$lte = new Date(req.query.endDate);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'firstName lastName email avatar')
        .populate('relatedLead', 'firstName lastName email')
        .populate('relatedCustomer', 'name email')
        .populate('relatedDeal', 'name value stage')
        .sort({ dueDate: 1, priority: -1 })
        .skip(skip).limit(limit),
      Task.countDocuments(filter)
    ]);

    res.status(200).json({ success: true, count: tasks.length, total, page, pages: Math.ceil(total / limit), data: tasks });
  } catch (error) { next(error); }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, ...req.companyFilter })
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('relatedLead', 'firstName lastName')
      .populate('relatedCustomer', 'name')
      .populate('relatedDeal', 'name stage');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, data: task });
  } catch (error) { next(error); }
};

exports.createTask = async (req, res, next) => {
  try {
    req.body.company_ref = req.user.company._id;
    req.body.createdBy = req.user._id;
    const task = await Task.create(req.body);

    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await Notification.create({
        title: 'New Task Assigned',
        message: `You have been assigned a task: ${task.title}`,
        type: 'task_assigned',
        recipient: task.assignedTo,
        relatedTask: task._id,
        company_ref: req.user.company._id,
        createdBy: req.user._id,
      });
    }

    res.status(201).json({ success: true, data: task });
  } catch (error) { next(error); }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (req.body.status === 'Completed' && task.status !== 'Completed') {
      req.body.completedAt = new Date();
    }

    req.body.updatedBy = req.user._id;
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('assignedTo', 'firstName lastName email avatar');

    res.status(200).json({ success: true, data: updated });
  } catch (error) { next(error); }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    await task.deleteOne();
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) { next(error); }
};
