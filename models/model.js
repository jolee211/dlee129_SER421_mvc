const fs = require('fs');
const VERTICAL = 'vertical';
const HORIZONTAL = 'horizontal';
let questions;
let answers;

function readJsonFromFile(filename) {
    let rawdata = fs.readFileSync(filename);
    let parsed = JSON.parse(rawdata);
    return parsed;
}

function getAllQuestions() {
    if (!questions) {
        let json = readJsonFromFile('survey.json');
        questions = json.questions;
        console.log(questions);
    }
    return questions;
}

function getKeyFromAnswer(answer) {
    return answer.username + answer.questionId;
}

function getKeyFromComposite(username, questionId) {
    return username + questionId;
}

function getAllAnswers() {
    if (!answers) {
        let json = readJsonFromFile('answers.json');
        answers = json.answers.reduce((map, obj) => {
            map[getKeyFromAnswer(obj)] = obj;
            return map;
        }, {});
        console.log(answers);
    }
    return answers;
}

function getPreviousAnswer(username, questionId) {
    let savedAnswer = getAllAnswers()[getKeyFromComposite(username, questionId)];
    if (savedAnswer) {
        return savedAnswer.answer;
    }
}

function getChoicesForQuestion(question) {
    return question.choices.map((val) => { return val.choice });
}

function saveAnswer(username, questionId, answer) {
    getAllAnswers()[getKeyFromComposite(username, questionId)] = {
        username: username,
        questionId: questionId,
        answer: answer
    };
    console.log(getAllAnswers());
}

function numberOfQuestions(questions) {
    return questions.size;
}

let renderIsVertical = false;

function getRenderingPreference() {
    if (renderIsVertical) {
        return VERTICAL;
    }
    return HORIZONTAL;
}

function setRenderingPreference(preference) {
    renderIsVertical = (preference === VERTICAL);
}

module.exports.getRenderingPreference = getRenderingPreference;
module.exports.getAllQuestions = getAllQuestions;
module.exports.getAllAnswers = getAllAnswers;
module.exports.getPreviousAnswer = getPreviousAnswer;
module.exports.getChoicesForQuestion = getChoicesForQuestion;
module.exports.saveAnswer = saveAnswer;
module.exports.numberOfQuestions = numberOfQuestions;
module.exports.setRenderingPreference = setRenderingPreference;
