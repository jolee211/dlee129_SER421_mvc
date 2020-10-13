let Model = require('../models/model');
const validator = require('express-validator');
const url = require('url');
let landingTitle = 'MVC Ex Solution Landing Page';
let surveyTitle = 'Survey';

// Returns an object with the cookies' names as keys
const getAppCookies = (req) => {
    // we extract the raw cookies from the request headers
    const rawCookies = req.headers.cookie.split('; ');
    // rawCookies = ['surveyApp=secretcookie', 'analytics_cookie=beacon']
    const parsedCookies = {};
    rawCookies.forEach((rawCookie) => {
        const parsedCookie = rawCookie.split('=');
        // parsedCookie = ['surveyApp', 'secretCookie']
        parsedCookies[parsedCookie[0]] = parsedCookie[1];
    });
    return parsedCookies;
}

// Returns the value of the renderingPreference cookie
const getRenderingPreference = (req, res) => getAppCookies(req, res)['renderingPreference'];

// Creates a renderingPreference cookie
const sendRenderingPreferenceCookie = (renderingPreference, res) => {
    res.cookie('renderingPreference', renderingPreference);
}

// Display landing page
exports.displayLanding = function(req, res) {
    let username;
    if (req.session.username) {
        username = req.session.username;
    } 
    if (!username) {
        const queryObject = url.parse(req.url, true).query;
        console.log(queryObject);
        username = queryObject.username;
    }
    if (username) {
        res.render('index', { 
            title: landingTitle, 
            headingText: landingTitle, 
            username: username
        });
    } else {
        res.render('index', { title: landingTitle, headingText: landingTitle });
    }
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

function renderQuestionPage(req, res, currentIndex, renderingPreference) {
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
        hasPrev: currentIndex > 0,
        renderDirection: renderingPreference
     });
}

const usernameValidatorForSpace = 
    // Validate that there are no spaces
    validator.check('username')
        .custom(value => !value.includes(' '))
        .withMessage('No spaces are allowed in the username');

const usernameValidatorForAlpha = 
    // Validate that usernames only allow combinations of uppercase and lowercase letters
    validator.body('username',
        'Usernames are only allowed with a combination of uppercase and lowercase letters')
        .isAlpha();

exports.processAction = [
    usernameValidatorForSpace,
    usernameValidatorForAlpha,
    (req, res) => {
        // Extract the validation errors from a request
        const errors = validator.validationResult(req);
        let username = req.body.username;
        req.session.username = username;
        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('index', { title: landingTitle, headingText: landingTitle, 
                username: username, errors: errors.array() });
            return;
        }

        let body = req.body;
        if (body.action === 'survey') {
            displayFirstQuestion(req, res, errors);
        } else if (body.action === 'match') {
            match(req, res);
        }
    }
];

// Display the first page of the survey for a user
    // Process request after validation and sanitization
function displayFirstQuestion(req, res) {
    // read in the survey questions
    let questions = Model.getAllQuestions();
    // read in the saved answers for all users
    let answers = Model.getAllAnswers();
    if (questions.length > 0) {
        // save variables into user session
        req.session.questions = questions;
        req.session.answers = answers;
        renderQuestionPage(req, res, 0, getCurrentRenderingPreference(req, res));
    } else {
        throw new Error('There is no survey defined');
    }
}

function getCurrentRenderingPreference(req, res) {
    let renderingPreference = getRenderingPreference(req, res);
    if (renderingPreference) {
        return renderingPreference;
    }
    
    let defaultRenderingPreference = Model.getDefaultRenderingPreference();
    sendRenderingPreferenceCookie(defaultRenderingPreference, res);
    return defaultRenderingPreference;
}

function renderThankYouPage(req, res, username) {
    res.render('thanks', { 
        title: surveyTitle,
        username: username,
    });
}

// Submit an answer to the current question and go to the next question
exports.submitAnswer = function(req, res) {
    if (!req.session.username) {
        res.render('improper');
        return;
    }
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
            renderQuestionPage(req, res, currentIndex, getRenderingPreference(req, res));
        } else {
            Model.persistAllAnswers((err) => {
                if (err) throw err;
                console.log('Answers persisted');
            });
            
            let username = req.session.username;
            req.session.destroy();
            renderThankYouPage(req, res, username);
        }
    } else if (body.submit === 'previous' && currentIndex > 0) {
        currentIndex--;
        renderQuestionPage(req, res, currentIndex, getRenderingPreference(req, res));
    }
};

// Display preferences page
exports.displayPreferences = function(req, res) {
    if (!req.session.username) {
        res.render('improper');
        return;
    }
    const queryObject = url.parse(req.url, true).query;
    console.log(queryObject);
    res.render('preferences', { 
        title: 'SER421 MVC Set Preferences',
        renderingPreference: getCurrentRenderingPreference(req, res),
        currentQuestionIndex: queryObject.currentQuestionIndex
     });
};

// Set the rendering preferences page and return to current question
exports.setPreferences = function(req, res) {
    if (!req.session.username) {
        res.render('improper');
        return;
    }
    let body = req.body;
    sendRenderingPreferenceCookie(body.preference, res);
    renderQuestionPage(req, res, parseInt(body.currentQuestionIndex) + 0, body.preference);
};

// Determine number of matches for current user
function match(req, res) {
    if (!req.session.username) {
        res.render('improper');
        return;
    }
    res.send('NOT IMPLEMENTED: Match user POST');
}