var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var surveyRouter = require('./routes/survey');  // Import routes for "survey" area
const { stat } = require('fs');

var app = express();

app.use(session({ secret: 'secret' }));
console.log('session handler initialized');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/survey', surveyRouter); // Add survey routes to middleware chain

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.warn(
    'Unhandled resource',
    {
      statusCode: 404,
      error: 'Unknown resource',
      resource: req.originalUrl
    }
  );
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  let status = err.status || 500;
  res.locals.status = status;
  res.status(status);
  console.error('Uncaught error', { statusCode: status, err });
  res.render('error');
});

module.exports = app;
console.log('app is exported');