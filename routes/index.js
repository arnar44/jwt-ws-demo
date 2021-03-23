const express = require('express');
const { login, register } = require('../utils/authenticate');
const { catchErrors } = require('../utils/utils');

const router = express.Router();

async function indexRoutes(req, res) {
  return res.json({
    authentication: {
      register: '/register',
      login: '/login',
    },
    articles: {
      articles: '/articles?search={query}',
      article: '/articles/{id}',
      article_comments: '/articles/{id}/comments',
      article_likes: '/articles/{id}/likes',
    },
    comments: {
      comment_likes: '/comments/{id}/likes',
    },
    topics: {
      topics: '/topics',
    },
    users: {
      users: '/users?search={query}',
      user: '/users/{id}',
      me: '/users/me',
      user_articles: '/users/{id}/articles',
      user_comments: '/users/{id}/comments',
    },
  });
}

router.get('/', catchErrors(indexRoutes));
router.post('/register', catchErrors(register));
router.post('/login', catchErrors(login));

module.exports = router;
