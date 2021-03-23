const express = require('express');
const {
  authAndGetRecord,
  requireAdminAndRecord,
  requireAdminOrOwner,
  requireAuth,
  requireOwner,
} = require('../utils/authenticate');

const {
  deleteRecordById,
  getAllQuery,
  getAllSearchQuery,
  getAllWithConditionQuery,
  patchUserQuery,
} = require('../db/queries');

const { catchErrors } = require('../utils/utils');

const router = express.Router();

async function getUsers(req, res) {
  const { offset = 0, limit = 10, search = null } = req.query;

  const params = {
    offset,
    limit,
    search,
    table: 'users',
    url: req.get('host'),
    col1: 'username',
    col2: 'name',
  };

  const result = search ?
    await getAllSearchQuery(params) :
    await getAllQuery(params);

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(200).json(result.item);
}

async function deleteUser(req, res) {
  const { record } = req;

  if (!record) throw new Error('Article record to delete not found!');

  const result = await deleteRecordById({
    id: record.id,
    table: 'users',
    columns: 'id, username, name, admin, pending',
  });

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(200).json(result.item);
}

async function patchUser(req, res) {
  const { user } = req;
  const { name, username, password } = req.body;

  const result = await patchUserQuery({
    user, newName: name, newUsername: username, newPass: password,
  });

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(200).json(result.item);
}

async function handleAdminRequest(req, res) {
  const { user, newPending } = req;

  if (user.admin || user.pending === newPending) {
    return res.status(200).json(req.user);
  }

  const result = await patchUserQuery({ user, newPending });

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(200).json(result.item);
}

function setPending(pending) {
  return (req, res, next) => {
    req.newPending = pending;
    return next();
  };
}

async function handleAdminResponse(req, res) {
  const { newAdmin } = req;
  const user = req.record;

  if (user.admin === newAdmin) {
    return res.status(200).json(req.user);
  }

  const result = await patchUserQuery({ user, newAdmin, newPending: false });

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(200).json(result.item);
}

function setAdminResponse(admin) {
  return (req, res, next) => {
    req.newAdmin = admin;
    return next();
  };
}

async function getUserContent(req, res) {
  const paramId = req.params.id;

  const id = paramId === 'me' ? req.user.id : paramId;
  const { table } = req;

  const result = await getAllWithConditionQuery({ id, table });

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  return res.status(200).json(result.item);
}

function setTable(table) {
  return (req, res, next) => {
    req.table = table;
    return next();
  };
}

const handlePendingAdd = [setPending(true), catchErrors(handleAdminRequest)];
const handlePendingRemove = [setPending(false), catchErrors(handleAdminRequest)];
const handleAcceptAdmin = [setAdminResponse(true), catchErrors(handleAdminResponse)];
const handleDeclineAdmin = [setAdminResponse(false), catchErrors(handleAdminResponse)];
const handleGetArticles = [requireAuth, setTable('articles'), catchErrors(getUserContent)];
const handleGetComments = [requireAuth, setTable('comments'), catchErrors(getUserContent)];

router.get('/', requireAuth, catchErrors(getUsers));
router.get('/:id', authAndGetRecord);
router.delete('/:id', requireAdminOrOwner, catchErrors(deleteUser));
router.patch('/me', requireAuth, catchErrors(patchUser));
router.post('/:id/requestAdmin', requireOwner, handlePendingAdd);
router.post('/:id/cancelAdminRequest', requireOwner, handlePendingRemove);
router.post('/:id/acceptAdmin', requireAdminAndRecord, handleAcceptAdmin);
router.post('/:id/declineAdmin', requireAdminAndRecord, handleDeclineAdmin);
router.get('/:id/articles', handleGetArticles);
router.get('/:id/comments', handleGetComments);

module.exports = router;
