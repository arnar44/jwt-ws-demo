const express = require('express');

const {
  authAndGetRecord,
  requireAdminOrOwner,
  requireAuth,
  requireOwner,
} = require('../utils/authenticate');

const {
  createArticleQuery,
  deleteRecordById,
  getAllAssesoryData,
  getAllSearchQuery,
  getAllQuery,
  patchArticleQuery,
  postCommentQuery,
} = require('../db/queries');

const {
  catchErrors,
  handleLikes,
} = require('../utils/utils');

const router = express.Router();

async function getArticles(req, res) {
  const { offset = 0, limit = 10, search = null } = req.query;

  const params = {
    offset,
    limit,
    search,
    table: 'articles',
    url: req.get('host'),
    col1: 'title',
    col2: 'article',
  };

  const result = search ?
    await getAllSearchQuery(params) :
    await getAllQuery(params);

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(200).json(result.item);
}

async function createArticle(req, res) {
  const { topic, title, article } = req.body;
  const { id } = req.user;

  const result = await createArticleQuery({
    id, topic, title, article,
  });

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(201).json(result.item);
}

async function commentOnArticle(req, res) {
  const { title, comment } = req.body;
  const { id } = req.user;
  const articleId = Number(req.params.id);

  const result = await postCommentQuery({
    title, comment, id, articleId,
  });

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(201).json(result.item);
}

async function patchArticle(req, res) {
  const { topic, title, article } = req.body;
  const { record } = req;

  if (!record) throw new Error('Article record to patch not found!');

  const result = await patchArticleQuery({
    topic, title, article, record,
  });

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(201).json(result.item);
}

async function deleteArticle(req, res) {
  const { record } = req;

  if (!record) throw new Error('Article record to delete not found!');

  const result = await deleteRecordById({ id: record.id, table: 'articles' });

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(200).json(result.item);
}

async function getArticleComments(req, res) {
  const { id } = req.params;
  const params = {
    id,
    table1: 'articles',
    table2: 'comments',
    condName1: 'id',
    condName2: 'articleid',
  };

  const result = await getAllAssesoryData(params);

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(200).json(result.item);
}

async function getArticleLikes(req, res) {
  const { id } = req.params;
  const params = {
    id,
    table1: 'articles',
    table2: 'article_likes',
    condName1: 'id',
    condName2: 'articleid',
  };

  const result = await getAllAssesoryData(params);

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(200).json(result.item);
}

router.get('/', requireAuth, catchErrors(getArticles));
router.post('/', requireAuth, catchErrors(createArticle));
router.get('/:id', authAndGetRecord);
router.post('/:id', requireAuth, catchErrors(commentOnArticle));
router.patch('/:id', requireOwner, patchArticle);
router.delete('/:id', requireAdminOrOwner, catchErrors(deleteArticle));
router.get('/:id/comments', requireAuth, catchErrors(getArticleComments));
router.post('/:id/like', requireAuth, handleLikes('articleid', 'article_likes', true));
router.post('/:id/dislike', requireAuth, handleLikes('articleid', 'article_likes', false));
router.get('/:id/likes', requireAuth, catchErrors(getArticleLikes));

module.exports = router;
