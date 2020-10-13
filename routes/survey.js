let express = require('express');
let router = express.Router();

// Require controller module
let survey_controller = require('../controllers/surveyController');

/// ROUTES ///

// GET landing page
router.get('/', survey_controller.displayLanding);

// POST request for displaying the first page of the survey
router.post('/', survey_controller.processAction);

// POST request for submitting an answer to the current question and going to the next question
router.post('/submitAnswer', survey_controller.submitAnswer);

// GET request for displaying the preferences page
router.get('/preferences', survey_controller.displayPreferences);

// POST request for setting the rendering preferences page and returning to current question
router.post('/setpreferences', survey_controller.setPreferences);

module.exports = router;
