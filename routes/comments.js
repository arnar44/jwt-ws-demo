const express = require('express');

const {
  requireAdminOrOwner,
  requireAuth,
  requireOwner,
} = require('../utils/authenticate');

const {
  deleteRecordById,
  editCommentQuery,
  getAllAssesoryData,
} = require('../db/queries');

const {
  catchErrors,
  handleLikes,
} = require('../utils/utils');

const router = express.Router();

async function editComment(req, res) {
  const { title, comment } = req.body;
  const { record } = req;

  if (!record) throw new Error('Article record to patch not found!');

  const result = await editCommentQuery({
    title, comment, record,
  });

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(200).json(result.item);
}

async function deleteComment(req, res) {
  const result = await deleteRecordById({ id: req.record.id, table: 'comments' });

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(200).json(result.item);
}

async function getCommentLikes(req, res) {
  const { id } = req.params;
  const params = {
    id,
    table1: 'comments',
    table2: 'comment_likes',
    condName1: 'id',
    condName2: 'commentid',
  };

  const result = await getAllAssesoryData(params);

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(200).json(result.item);
}

router.patch('/:id', requireOwner, catchErrors(editComment));
router.delete('/:id', requireAdminOrOwner, catchErrors(deleteComment));
router.post('/:id/like', requireAuth, handleLikes('commentid', 'comment_likes', true));
router.post('/:id/dislike', requireAuth, handleLikes('commentid', 'comment_likes', false));
router.get('/:id/likes', requireAuth, catchErrors(getCommentLikes));

module.exports = router;
