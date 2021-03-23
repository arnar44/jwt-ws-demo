require('dotenv').config();

const express = require('express');

const index = require('./routes/index');
const articles = require('./routes/articles');
const comments = require('./routes/comments');
const topics = require('./routes/topics');
const users = require('./routes/users');

const app = express();
app.use(express.json());

app.use('/', index);
app.use('/articles', articles);
app.use('/comments', comments);
app.use('/topics', topics);
app.use('/users', users);

function notFoundHandler(req, res, next) { // eslint-disable-line
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, next) { // eslint-disable-line
  console.error(err);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid json' });
  }

  return res.status(500).json({ error: 'Internal server error' });
}

app.use(notFoundHandler);
app.use(errorHandler);

const {
  PORT: port = 3000,
  HOST: host = '127.0.0.1',
} = process.env;

app.listen(port, () => {
  console.info(`Server running at http://${host}:${port}/`);
});
