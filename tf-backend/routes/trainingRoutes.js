const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Training Controllers
const { AddtrainingController, AddtrainingServicePaymentController, AddTrainingServiceGetPaymentController, GetTrainingController } = require('../controllers/trainingController');

// Validators
const addTrainingSchema = Joi.object({
    user_id: Joi.string().uuid().required(),
    service_id: Joi.string().uuid().required(),
    price: Joi.number().min(0).precision(2).required(),
    training_date: Joi.string().trim().required(),
    training_time: Joi.string().trim().required()
});

const trainingPaymentSchema = Joi.object({
    trainingId: Joi.string().uuid().required(),
    amount: Joi.number().min(0.01).precision(2).required()
});

/**
 * @route   POST /api/training
 * @desc    Add training service
 * @access  Private
 */
router.post('/', authenticate, validate(addTrainingSchema), AddtrainingController);

/**
 * @route   POST /api/training/payment
 * @desc    Process training payment
 * @access  Private
 */
router.post('/payment', authenticate, validate(trainingPaymentSchema), AddtrainingServicePaymentController);

/**
 * @route   POST /api/training/payment-intent
 * @desc    Get training payment intent
 * @access  Private
 */
router.post('/payment-intent', authenticate, validate(trainingPaymentSchema), AddTrainingServiceGetPaymentController);

/**
 * @route   GET /api/training
 * @desc    Get training services
 * @access  Private
 */
router.get('/', authenticate, GetTrainingController);

module.exports = router;

