const validator = require('validator');

function validateUser({ username, name, password }) {
  const errors = [];

  if (typeof username !== 'string' || !validator.isLength(username, { min: 3, max: 15 })) {
    errors.push({
      field: 'username',
      message: 'Username must be a string of length 3 to 15 characters',
    });
  }

  if (typeof password !== 'string' || !validator.isLength(password, { min: 5, max: 25 })) {
    errors.push({
      field: 'password',
      message: 'Password must be a string of length 5 to 25 characters',
    });
  }

  if (typeof name !== 'string' || !validator.isLength(name, { min: 1, max: 40 })) {
    errors.push({
      field: 'name',
      message: 'Name must be a string of length 1 to 40 characters',
    });
  }

  return errors;
}

function validateArticle({
  topic, title, article,
}) {
  const errors = [];

  if (typeof topic !== 'string' || !validator.isLength(topic, { min: 2, max: 30 })) {
    errors.push({
      field: 'topic',
      message: 'Topic must be a string of length 2 to 30 characters',
    });
  }

  if (typeof title !== 'string' || !validator.isLength(title, { min: 1, max: 50 })) {
    errors.push({
      field: 'title',
      message: 'Title must be a string of length 1 to 50 characters',
    });
  }

  if (typeof article !== 'string' || !validator.isLength(article, { min: 1, max: 500 })) {
    errors.push({
      field: 'article',
      message: 'Article must be a string of length 1 to 500 characters',
    });
  }

  return errors;
}

function validateTopic(topic) {
  const errors = [];

  if (typeof topic !== 'string' || !validator.isLength(topic, { min: 2, max: 30 })) {
    errors.push({
      field: 'topic',
      message: 'Topic must be a string of length 2 to 30 characters',
    });
  }

  return errors;
}

function validateComment({ title, comment }) {
  const errors = [];

  if (typeof title !== 'string' || !validator.isLength(title, { min: 1, max: 25 })) {
    errors.push({
      field: 'title',
      message: 'Title must be a string of length 1 to 25 characters',
    });
  }

  if (typeof comment !== 'string' || !validator.isLength(comment, { min: 1, max: 200 })) {
    errors.push({
      field: 'comment',
      message: 'Comment must be a string of length 1 to 200 characters',
    });
  }

  return errors;
}

module.exports = {
  validateArticle,
  validateComment,
  validateTopic,
  validateUser,
};
