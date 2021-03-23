const express = require('express');

const {
  requireAuth,
  requireAdmin,
} = require('../utils/authenticate');

const {
  createTopicQuery,
  deleteRecordById,
  getAllQuery,
  patchTopicQuery,
} = require('../db/queries');

const { catchErrors } = require('../utils/utils');

const router = express.Router();

async function getTopics(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const params = {
    offset,
    limit,
    table: 'topics',
    url: req.get('host'),
  };

  const result = await getAllQuery(params);

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(200).json(result.item);
}

async function createTopic(req, res) {
  const { topic } = req.body;

  const result = await createTopicQuery(topic);

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(201).json(result.item);
}

async function patchTopic(req, res) {
  const { topic } = req.body;

  const id = Number(req.params.id);

  const result = await patchTopicQuery(id, topic);

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(201).json(result.item);
}

async function deleteTopic(req, res) {
  const { id } = req.params;

  const result = await deleteRecordById({ id, table: 'topics' });

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(200).json(result.item);
}

router.get('/', requireAuth, catchErrors(getTopics));
router.post('/', requireAdmin, catchErrors(createTopic));
router.patch('/:id', requireAdmin, catchErrors(patchTopic));
router.delete('/:id', requireAdmin, catchErrors(deleteTopic));

module.exports = router;
