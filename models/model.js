const fs = require('fs');
const VERTICAL = 'vertical';
const HORIZONTAL = 'horizontal';
let questions;
let answers;
let answersByUsername;

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

function readAllAnswersFromFile() {
    let json = readJsonFromFile('answers.json');
    answersByUsername = new Map();
    answersByQuestionId = new Map();
    answers = json.reduce((map, obj) => {
        // store each answer in a map (key=username + questionId)
        map.set(getKeyFromAnswer(obj), obj);

        // store an array of answers by username in another map
        let arr;
        let key = obj.username;
        if (answersByUsername.has(key)) {
            arr = answersByUsername.get(key);
            arr.push(obj);
        } else {
            arr = [obj];
        }
        answersByUsername.set(key, arr);

        // store an array of answers by questionId in another map
        let arr2;
        let key2 = obj.questionId;
        if (answersByQuestionId.has(key2)) {
            arr2 = answersByQuestionId.get(key2);
            arr2.push(obj);
        } else {
            arr2 = [obj];
        }
        answersByQuestionId.set(key2, arr2);

        return map;
    }, new Map());
    console.log(answers);
    console.log(answersByUsername);
    console.log(answersByQuestionId);
}

function getAllAnswers() {
    if (!answers) {
        readAllAnswersFromFile();
    }
    return answers;
}

function persistAllAnswers(f) {
    if (answers) {
        let answersArray = Array.from(answers.values());
        let data = JSON.stringify(answersArray, null, 2);
        fs.writeFile('answers.json', data, f);
    }
}

function getPreviousAnswer(username, questionId) {
    let savedAnswer = getAllAnswers().get(getKeyFromComposite(username, questionId));
    if (savedAnswer) {
        return savedAnswer.answer;
    }
    return savedAnswer;
}

function getAllAnswersForUser(username) {
    if (answersByUsername) {
        return answersByUsername.get(username);
    }
    return [];
}

function getAllAnswersForQuestion(questionId) {
    if (answersByQuestionId) {
        return answersByQuestionId.get(questionId);
    }
    return [];
}

function getChoicesForQuestion(question) {
    return question.choices.map((val) => { return val.choice });
}

function saveAnswer(username, questionId, answer) {
    getAllAnswers().set(getKeyFromComposite(username, questionId), {
        username: username,
        questionId: questionId,
        answer: answer
    });
    console.log(getAllAnswers());
}

function numberOfQuestions(questions) {
    return questions.size;
}

let renderIsVertical = false;

function getDefaultRenderingPreference() {
    if (renderIsVertical) {
        return VERTICAL;
    }
    return HORIZONTAL;
}

readAllAnswersFromFile();

module.exports.getDefaultRenderingPreference = getDefaultRenderingPreference;
module.exports.getAllQuestions = getAllQuestions;
module.exports.getAllAnswers = getAllAnswers;
module.exports.getPreviousAnswer = getPreviousAnswer;
module.exports.getChoicesForQuestion = getChoicesForQuestion;
module.exports.saveAnswer = saveAnswer;
module.exports.numberOfQuestions = numberOfQuestions;
module.exports.persistAllAnswers = persistAllAnswers;
module.exports.getAllAnswersForUser = getAllAnswersForUser;
module.exports.getAllAnswersForQuestion = getAllAnswersForQuestion;