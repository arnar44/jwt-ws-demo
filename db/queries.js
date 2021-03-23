/* eslint-disable max-len */ // Contains long query lines
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Client } = require('pg');
const xss = require('xss');

const connectionString = process.env.DATABASE_URL;

const {
  validateArticle,
  validateComment,
  validateTopic,
  validateUser,
} = require('../utils/validation');

async function query(q, values = []) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const result = await client.query(q, values);
    return result;
  } catch (err) {
    return { error: err };
  } finally {
    await client.end();
  }
}

function prepareResult(rows, table, offset, limit, url, search) {
  const result = {
    links: {
      self: {
        href: `http://${url}/${table}${search}offset=${offset}&limit=${limit}`,
      },
    },
    limit,
    offset,
    items: rows,
  };

  // If offset results, insert path to 'prev' results
  if (offset > 0) {
    result.links.prev = {
      href: `http://${url}/${table}${search}offset=${offset - limit}&limit=${limit}`,
    };
  }

  // If there are no more results, don't return 'next' results
  if (!(rows.length < limit)) {
    result.links.next = {
      href: `http://${url}/${table}${search}offset=${Number(offset) + limit}&limit=${limit}`,
    };
  }

  return result;
}

function errorResponse({
  error, details, code = 400, validation = [],
}) {
  console.error(error, details, validation);

  return {
    success: false,
    code,
    obj: {
      error,
      details,
      validation,
    },
  };
}

function successResponse(item) {
  return {
    success: true,
    item,
  };
}

/* User queries */

async function createUserQuery({ username, name, password } = {}) {
  const validation = validateUser({ username, name, password });

  if (validation.length > 0) {
    return errorResponse({ error: 'Validation Error', validation });
  }

  const cleanUsername = xss(username);
  const cleanName = xss(name);
  const hashedPassword = await bcrypt.hash(xss(password), 11);

  const q = 'INSERT INTO users (username, name, password, admin, pending) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, name, admin, pending';

  const result = await query(q, [cleanUsername, cleanName, hashedPassword, false, false]);

  if (result.error) {
    return errorResponse({ error: 'Error creating user', details: result.error });
  }

  return successResponse(result.rows[0]);
}

async function patchUserQuery({
  user, newName, newUsername, newPass, newAdmin, newPending,
}) {
  const name = newName ? xss(newName) : user.name;
  const username = newUsername ? xss(newUsername) : user.username;
  const password = newPass ? xss(newPass) : null;
  const admin = newAdmin == null ? user.admin : newAdmin;
  const pending = newPending == null ? user.pending : newPending;

  const validation = newPass ?
    validateUser({ username, name, password }) :
    validateUser({ username, name, password: 'legitPass' });

  if (validation.length > 0) {
    return errorResponse({ error: 'Validation Error', validation });
  }

  let q;
  let values;
  if (newPass) {
    const hashedPassword = await bcrypt.hash(password, 11);
    q = 'UPDATE users SET (name, username, password, admin, pending) = ($1, $2, $3, $4, $5) WHERE id = $6 RETURNING id, name, username, name, admin, pending';
    values = [name, username, hashedPassword, admin, pending, user.id];
  } else {
    q = 'UPDATE users SET (name, username, admin, pending) = ($1, $2, $3, $4) WHERE id = $5 RETURNING id, name, username, name, admin, pending';
    values = [name, username, admin, pending, user.id];
  }

  const result = await query(q, values);

  if (result.error) {
    return errorResponse({ error: 'Error updating user', details: result.error });
  }

  return successResponse(result.rows[0]);
}

/* Article queries */

async function createArticleQuery({
  id, topic, title, article,
} = {}) {
  const topicsQ = 'SELECT 1 FROM topics WHERE name = $1 LIMIT 1';
  const topicsResult = await query(topicsQ, [topic]);

  if (topicsResult.error) {
    return errorResponse({ error: 'Error getting topics', details: topicsResult.error });
  }

  const topicExists = topicsResult.rows.length > 0;
  const validation = validateArticle({
    topic, title, article, topicExists,
  });

  if (validation.length > 0) {
    return errorResponse({ error: 'Validation error', validation });
  }

  const cleanTopic = xss(topic);
  const cleanTitle = xss(title);
  const cleanArticle = xss(article);

  const q = 'INSERT INTO articles (userid, topic, title, article) VALUES ($1, $2, $3, $4) RETURNING *';

  const result = await query(q, [id, cleanTopic, cleanTitle, cleanArticle]);

  if (result.error) {
    return errorResponse({ error: 'Error creating article', details: result.error });
  }

  return successResponse(result.rows[0]);
}

async function patchArticleQuery({
  topic, title, article, record,
} = {}) {
  const cleanTitle = title ? xss(title) : record.title;
  const cleanArticle = article ? xss(article) : record.article;
  const cleanTopic = topic ? xss(topic) : record.topic;

  const validationObj = {
    topic: cleanTopic,
    title: cleanTitle,
    article: cleanArticle,
  };

  const validation = validateArticle(validationObj);

  if (validation.length > 0) {
    return errorResponse({ error: 'Validation Error', validation });
  }

  const q = 'UPDATE articles SET (topic, title, article) = ($1, $2, $3) WHERE id = $4 RETURNING *';

  const result = await query(q, [cleanTopic, cleanTitle, cleanArticle, record.id]);

  if (result.error) {
    return errorResponse({ error: 'Error updating article', details: result.error });
  }

  return successResponse(result.rows[0]);
}

/* Article comment queries */

async function postCommentQuery({
  title, comment, id, articleId,
} = {}) {
  let q = 'SELECT * FROM articles WHERE id = $1 LIMIT 1';
  let result = await query(q, [articleId]);

  if (result.error) {
    return errorResponse({ error: 'Error finding article to comment on', details: result.error });
  }

  if (result.rows.length === 0) {
    return errorResponse({ error: 'Article not found', code: 404 });
  }

  const validation = validateComment({ title, comment });

  if (validation.length > 0) {
    return errorResponse({ error: 'Validation error', validation });
  }

  const cleanTitle = xss(title);
  const cleanComment = xss(comment);

  q = 'INSERT INTO comments (userid, articleid, title, comment) VALUES ($1, $2, $3, $4) RETURNING *';
  result = await query(q, [id, articleId, cleanTitle, cleanComment]);

  if (result.error) {
    return errorResponse({ error: 'Error commenting on article', details: result.error });
  }

  return successResponse(result.rows[0]);
}

async function editCommentQuery({
  title, comment, record,
} = {}) {
  const cleanTitle = title ? xss(title) : record.title;
  const cleanComment = comment ? xss(comment) : record.comment;

  const validationObj = {
    title: cleanTitle,
    comment: cleanComment,
  };

  const validation = validateComment(validationObj);

  if (validation.length > 0) {
    return errorResponse({ error: 'Validation error', validation });
  }

  const q = 'UPDATE comments SET (title, comment) = ($1, $2) WHERE id = $3 RETURNING *';
  const result = await query(q, [cleanTitle, cleanComment, record.id]);

  if (result.error) {
    return errorResponse({ error: 'Error updating comment', details: result.error });
  }

  return successResponse(result.rows[0]);
}

/* Topics queries */

async function createTopicQuery(topic) {
  const validation = validateTopic(topic);

  if (validation.length > 0) {
    return errorResponse({ error: 'Validation error', validation });
  }

  const cleanTopic = xss(topic);

  const q = 'INSERT INTO topics (name) VALUES ($1) RETURNING *';

  const result = await query(q, [cleanTopic]);

  if (result.error) {
    return errorResponse({ error: 'Erro creating topic', details: result.error });
  }

  return successResponse(result.rows[0]);
}

async function patchTopicQuery(topicId, topic) {
  const validation = validateTopic(topic);

  if (validation.length > 0) {
    return errorResponse({ error: 'Validation error', validation });
  }

  const cleanTopic = xss(topic);

  const q = 'UPDATE topics SET name = $1 WHERE id = $2 RETURNING *';

  const result = await query(q, [cleanTopic, topicId]);

  if (result.error) {
    return errorResponse({ error: 'Error updating topic', details: result.error });
  }

  return successResponse(result.rows[0]);
}

/* Multi-use queries, depend on the variables */

async function getAllQuery(params) {
  const returnables = params.table === 'users' ? 'id, username, name, admin, pending' : '*';
  const q = `SELECT ${returnables} FROM ${params.table} ORDER BY id OFFSET $1 Limit $2`;

  const cleanOffset = Number(xss(params.offset));
  const cleanLimit = Number((xss(params.limit)));

  const result = await query(q, [cleanOffset, cleanLimit]);

  if (result.error) {
    return errorResponse({ error: `Error getting 'all' from table ${params.table}`, details: result.error });
  }

  const { rows } = result;
  const preparedResults = prepareResult(rows, params.table, cleanOffset, cleanLimit, params.url, '/?');

  return successResponse(preparedResults);
}

async function getAllSearchQuery(params) {
  const returnables = params.table === 'users' ? 'id, username, name, admin, pending' : '*';
  const q = `SELECT ${returnables} FROM ${params.table} WHERE to_tsvector(${params.col1} || ' ' || ${params.col2}) @@ plainto_tsquery($1) ORDER BY id OFFSET $2 Limit $3`;

  const cleanOffset = Number(xss(params.offset));
  const cleanLimit = Number(xss(params.limit));
  const cleanSearch = xss(params.search).replace(/-/g, ' ');

  const result = await query(q, [cleanSearch, cleanOffset, cleanLimit]);

  if (result.error) {
    return errorResponse({ error: `Error searching in table ${params.table}`, details: result.error });
  }

  const { rows } = result;
  const pR = prepareResult(rows, params.table, cleanOffset, cleanLimit, params.url, cleanSearch);

  return successResponse(pR);
}

async function getRecordByIdQuery({ id, table, columns = '*' } = {}) {
  const q = `SELECT ${columns} FROM ${table} WHERE id = $1 LIMIT 1`;

  const result = await query(q, [id]);

  if (result.error) {
    return errorResponse({ error: `Error getting record from ${table}`, details: result.error });
  }

  if (result.rows.length === 0) {
    return errorResponse({ error: 'Record not found', code: 404 });
  }

  return successResponse(result.rows[0]);
}

async function deleteRecordById({ id, table, columns = '*' } = {}) {
  const q = `DELETE FROM ${table} WHERE id = $1 RETURNING ${columns}`;

  const result = await query(q, [id]);

  if (result.error) {
    return errorResponse({ error: `Error deleting record from table = ${table}`, details: result.error });
  }

  if (result.rows.length === 0) {
    return errorResponse({ error: 'Record not found!', code: 404 });
  }

  return successResponse(result.rows[0]);
}

async function handleLikesQuery({
  id, columnId, isLike, columnName, table,
} = {}) {
  const q = `INSERT INTO ${table} (userid, ${columnName}, islike) VALUES ($1, $2, $3) ON CONFLICT (userid, ${columnName}) DO UPDATE SET islike = $3 RETURNING *`;
  const result = await query(q, [id, columnId, isLike]);

  if (result.error) {
    if (result.error.code === '23503') {
      return errorResponse({ error: 'Record not found!', code: 404 });
    }

    return errorResponse({ error: 'Error posting like/dislike', details: result.error });
  }

  return successResponse(result.rows[0]);
}

async function getAllWithConditionQuery({ id, table } = {}) {
  const qR = `SELECT * FROM ${table} WHERE userid = $1 ORDER BY id`;
  const qU = 'SELECT * FROM users WHERE id = $1';

  const [resultRecord, resultUser] = await Promise.all([query(qR, [id]), query(qU, [id])]);

  if (resultUser.error) {
    return errorResponse({ error: 'Error getting user records', details: resultUser.error });
  }

  if (resultUser.rows.length === 0) {
    return errorResponse({ error: 'User not found', code: 404 });
  }

  if (resultRecord.error) {
    return errorResponse({ error: `Error getting user records from ${table}`, details: resultRecord.error });
  }

  return successResponse(resultRecord.rows);
}

async function getAllAssesoryData({
  id, table1, table2, condName1, condName2,
} = {}) {
  const q1 = `SELECT * FROM ${table1} WHERE ${condName1} = $1 ORDER BY id`;
  const q2 = `SELECT * FROM ${table2} WHERE ${condName2} = $1 ORDER BY id`;

  const [result1, result2] = await Promise.all([query(q1, [id]), query(q2, [id])]);

  if (result1.error) {
    return errorResponse({ error: `Error finding record in ${table1}`, details: result1.error });
  }

  if (result1.rows.length === 0) {
    return errorResponse({ error: `Record not found in ${table1}`, code: 404 });
  }

  if (result2.error) {
    return errorResponse({ error: `Error finding records in ${table2}`, details: result2.error });
  }

  return successResponse(result2.rows);
}

/* Queries only used locally (no need to sanitize and validate) */

async function getUserByUsernameQuery(username) {
  const q = 'SELECT * FROM users WHERE username = $1';
  const result = await query(q, [username]);

  if (result.error) {
    return errorResponse({ error: `Error finding user with username = ${username}`, details: result.error, code: 401 });
  }

  if (result.rowCount === 0) {
    const validation = [{
      field: 'username',
      message: `No user with username = ${username} found`,
    }];
    return errorResponse({ error: 'Validation error', validation });
  }

  if (result.rowCount > 1) {
    return errorResponse({ error: `Expected exactly 1 query result, got ${result.rowCount}`, code: 500 });
  }

  return successResponse(result.rows[0]);
}

async function createUserLocallyQuery({
  username, name, password, admin, pending,
}) {
  const q = 'INSERT INTO users (username, name, password, admin, pending) VALUES ($1, $2, $3, $4, $5)';

  const hashedPassword = await bcrypt.hash(password, 11);
  const result = await query(q, [username, name, hashedPassword, admin, pending]);

  if (result.error) {
    console.error(`Error creating user ${username}`, result.error);
  }
}

module.exports = {
  createArticleQuery,
  createTopicQuery,
  createUserLocallyQuery,
  createUserQuery,
  deleteRecordById,
  editCommentQuery,
  getAllAssesoryData,
  getAllQuery,
  getAllSearchQuery,
  getAllWithConditionQuery,
  getRecordByIdQuery,
  getUserByUsernameQuery,
  handleLikesQuery,
  patchArticleQuery,
  patchTopicQuery,
  patchUserQuery,
  postCommentQuery,
};
