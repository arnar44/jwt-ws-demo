const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { Strategy, ExtractJwt } = require('passport-jwt');
const jwt = require('jsonwebtoken');

const {
  createUserQuery,
  getRecordByIdQuery,
  getUserByUsernameQuery,
} = require('../db/queries');

const { catchErrors } = require('./utils');

const auth = express();

const {
  JWT_SECRET: jwtSecret,
  TOKEN_LIFETIME: tokenLifeTime,
} = process.env;

if (!jwtSecret) {
  console.error('JWT_SECRET not found in .env');
  process.exit(1);
}

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
};

async function verify(jwtData, done) {
  const { id } = jwtData;
  const result = await getRecordByIdQuery(
    { id, table: 'users', columns: 'id, username, name, admin, pending' },
  );

  if (!result.success) {
    // User not found in database, has been deleted -> 401 unauthorized because token is invalide
    if (result.code === 404) return done(null, false, { name: '' });

    // Otherwise there is an internal error -> 500 internal server error
    return done(result.obj);
  }

  if (!result.item.id) return done(null, false);

  return done(null, result.item);
}

passport.use(new Strategy(jwtOptions, verify));
auth.use(passport.initialize());

async function comparePasswords(hash, password) {
  const result = await bcrypt.compare(password, hash);

  return result;
}

function createToken(id) {
  const payload = { id };
  const tokenOptions = { expiresIn: parseInt(tokenLifeTime, 10) };
  return jwt.sign(payload, jwtOptions.secretOrKey, tokenOptions);
}

async function register(req, res) {
  const { username, name, password } = req.body;

  const result = await createUserQuery({ username, name, password });

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  result.item.token = createToken(result.item.id);

  return res.status(201).json(result.item);
}

async function login(req, res) {
  const { username, password } = req.body;
  const response = await getUserByUsernameQuery(username);

  if (!response.success) {
    return res.status(response.code).json(response.obj);
  }

  const user = response.item;
  const passwordIsCorrect = await comparePasswords(user.password, password);

  if (passwordIsCorrect) {
    const token = createToken(user.id);
    return res.json({ token });
  }

  const serverResponse = {
    error: 'Invalid password',
    details: '',
    validation: [{
      field: 'password',
      message: 'Invalid password',
    }],
  };

  return res.status(401).json(serverResponse);
}

function requireAuth(req, res, next) {
  return passport.authenticate(
    'jwt',
    { session: false },
    (err, user, info) => {
      if (err) return next(err);

      if (!user) {
        const error = info.name === 'TokenExpiredError' ? 'expired token' : 'invalid token';
        return res.status(401).json({ error });
      }

      req.user = user;
      return next();
    },
  )(req, res, next);
}

function requireAdminAuth(req, res, next) {
  if (req.user && req.user.admin) {
    return next();
  }

  return res.status(403).json({ error: 'Forbidden' });
}

function requireOwnerOrAdminAuth(req, res, next) {
  const { id, admin } = req.user;
  const { userid } = req.record;

  if (admin || userid === id) return next();

  return res.status(403).json({ error: 'Forbidden' });
}

function requireOwnerAuth(req, res, next) {
  const { id } = req.user;
  const { userid } = req.record;

  if (id === userid) return next();

  return res.status(403).json({ error: 'Forbidden' });
}

async function addRecordToRequest(req, res, next) {
  const tableNames = ['topics', 'articles', 'comments', 'users'];
  const paramId = req.params.id;
  const table = req.baseUrl.replace('/', '');

  const id = table === 'users' && paramId === 'me' ?
    req.user.id :
    Number(paramId);

  // Check if id is integer
  const parsedId = parseFloat(id);
  // eslint-disable-next-line no-bitwise
  if (Number.isNaN(id) || (parsedId | 0) !== parsedId) {
    return res.status(400).json({ error: 'ID is not an integer' });
  }

  // Check if table is in tablenames
  if (!tableNames.includes(table)) {
    return res.status(400).json({ error: `${table} is not a valid table name` });
  }

  // Check if record is own user data which is already stored
  if (table === 'users' && id === req.user.id) {
    req.record = req.user;
    req.record.userid = req.user.id;
    return next();
  }

  const columns = table === 'users' ? 'id, username, name, admin, pending' : '*';

  const result = await getRecordByIdQuery({ id, table, columns });

  if (!result.success) {
    return res.status(result.code).json(result.obj);
  }

  req.record = result.item;

  return next();
}

function getRecord(req, res) {
  if (!req.record) throw new Error('Article record not found!');

  return res.status(200).json(req.record);
}

const requireAdmin = [requireAuth, requireAdminAuth];
const requireAdminAndRecord = [requireAuth, requireAdminAuth, catchErrors(addRecordToRequest)];
const requireAdminOrOwner = [requireAuth, catchErrors(addRecordToRequest), requireOwnerOrAdminAuth];
const requireOwner = [requireAuth, catchErrors(addRecordToRequest), requireOwnerAuth];
const authAndGetRecord = [requireAuth, catchErrors(addRecordToRequest), getRecord];

module.exports = {
  authAndGetRecord,
  catchErrors,
  login,
  register,
  requireAdmin,
  requireAdminAndRecord,
  requireAdminOrOwner,
  requireAuth,
  requireOwner,
};
