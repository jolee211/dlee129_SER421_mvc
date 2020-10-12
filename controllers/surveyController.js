let Model = require('../models/model');
const validator = require('express-validator');
const url = require('url');
let landingTitle = 'MVC Ex Solution Landing Page';
let surveyTitle = 'Survey';

function isAlpha(string) {
    let chars = string.split('');

    chars.forEach((c) => {
        if (!(/[a-zA-Z]/).test(c)) {
            return false;
        }
    });
    return true;
}

// Display landing page
exports.displayLanding = function(req, res) {
    res.render('index', { title: landingTitle, headingText: landingTitle });
};

function getQuestions(req) {
    let questions;
    if (req.session.questions) {
        questions = req.session.questions;
    } else {
        questions = Model.getAllQuestions();
    }
    return questions;
}

function renderQuestionPage(req, res, currentIndex) {
    let questions = getQuestions(req);
    let currentQuestion = questions[currentIndex];
    let questionId = currentQuestion.id;
    let choices = Model.getChoicesForQuestion(currentQuestion);
    let username = req.session.username;
    res.render('survey', { 
        title: surveyTitle,
        page: currentIndex + 1,
        questionText: currentQuestion.question,
        username: username,
        questionId: questionId,
        savedAnswer: Model.getPreviousAnswer(username, questionId),
        choices: choices,
        hasPrev: currentIndex > 0
     });
}

// Display the first page of the survey for a user
exports.displayFirstQuestion = [
    // Validate that there are no spaces
    validator.check('username')
        .custom(value => !value.includes(' '))
        .withMessage('No spaces are allowed in the username'),
    // Validate that usernames only allow combinations of uppercase and lowercase letters
    validator.body('username',
        'Usernames are only allowed with a combination of uppercase and lowercase letters')
        .isAlpha(),
    // Process request after validation and sanitization
    (req, res, next) => {
        // Extract the validation errors from a request
        const errors = validator.validationResult(req);
        let username = req.body.username;
        req.session.username = username;
        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('index', { title: landingTitle, headingText: landingTitle, 
                username: username, errors: errors.array() });
            return;
        } else {
            // read in the survey questions
            let questions = Model.getAllQuestions();
            // read in the saved answers for all users
            let answers = Model.getAllAnswers();
            if (questions.length > 0) {
                // find all the answers for current user
                // then find the answer for the first question
                let firstQuestion = questions[0];
                let questionId = firstQuestion.id;
                let savedAnswer = Model.getPreviousAnswer(username, questionId);
                console.log(`Saved answer for first question for ${username}: ${savedAnswer}`);

                let choices = Model.getChoicesForQuestion(firstQuestion);
                console.log(choices);

                // save variables into user session
                req.session.questions = questions;
                req.session.answers = answers;
                req.session.currentIndex = 0;
                res.render('survey', { 
                    title: surveyTitle,
                    page: 1,
                    questionText: firstQuestion.question,
                    username: username,
                    questionId: questionId,
                    savedAnswer: savedAnswer,
                    choices: choices
                 });
            } else {
                throw new Error('There is no survey defined');
            }
        }
    }
];

// Submit an answer to the current question and go to the next question
exports.submitAnswer = function(req, res) {
    let body = req.body;
    // take current answer and save it
    Model.saveAnswer(req.session.username, body.questionId, body.answer);
    let currentIndex;
    if (body.page) {
        currentIndex = parseInt(body.page) - 1;
    } else {
        currentIndex = 0;
    }
    if (body.submit === 'next') {
        if (currentIndex < getQuestions(req).length - 1) {
            currentIndex++;
            renderQuestionPage(req, res, currentIndex);
        } else {
            res.send('NOT IMPLEMENTED: Submit answer survey finished');
        }
    } else if (body.submit === 'previous' && currentIndex > 0) {
        currentIndex--;
        renderQuestionPage(req, res, currentIndex);
    }
};

// Display preferences page
exports.displayPreferences = function(req, res) {
    const queryObject = url.parse(req.url, true).query;
    console.log(queryObject);
    res.render('preferences', { 
        title: 'SER421 MVC Set Preferences',
        renderingPreference: Model.getRenderingPreference(),
        currentQuestionIndex: queryObject.currentQuestionIndex
     });
};

// Set the rendering preferences page and return to current question
exports.setPreferences = function(req, res) {
    let body = req.body;
    Model.setRenderingPreference(body.preference);
    renderQuestionPage(req, res, parseInt(body.currentQuestionIndex) + 0);
};

// Submit an answer to the current question and go to the previous question
exports.survey_question_prev = function(req, res) {
    res.send('NOT IMPLEMENTED: Submit answer prev POST');
};

// Determine number of matches for current user
exports.match_username = function(req, res) {
    res.send('NOT IMPLEMENTED: Match user POST');
};
