const Papa = require('papaparse');
const fs = require('fs');
const util = require('util');
const {
  createArticleQuery,
  createTopicQuery,
  createUserLocallyQuery,
  handleLikesQuery,
  postCommentQuery,
} = require('../db/queries');

const readFileAsync = util.promisify(fs.readFile);

const encoding = 'utf8';
const USERS_CSV = './data/users.csv';
const TOPICS_CSV = './data/topics.csv';
const ARTICLES_CSV = './data/articles.csv';
const COMMENTS_CSV = './data/comments.csv';
const ARTICLE_LIKES_CSV = './data/article_likes.csv';
const COMMENT_LIKES_CSV = './data/comment_likes.csv';

async function read(file) {
  const data = await readFileAsync(file);

  return data.toString(encoding);
}
function parse(data) {
  return Papa.parse(data, {
    header: true,
    delimiter: ',',
    quoteChar: '"',
  });
}

async function makeUsers(data) {
  for (const line of data) { //eslint-disable-line
    const {
      name = '',
      username = '',
      password = '',
      admin = '',
      pending = '',
    } = line;
    await createUserLocallyQuery({ name, username, password, admin, pending }); //eslint-disable-line
  }
}

async function makeTopics(data) {
  for (const line of data) { // eslint-disable-line
    const {
      name = '',
    } = line;
    await createTopicQuery(name); // eslint-disable-line
  }
}

async function makeArticles(data) {
  for (const line of data) { //eslint-disable-line
    const {
      userid = '',
      topic = '',
      title = '',
      article = '',
    } = line;
    await createArticleQuery({ id: userid, topic, title, article}); //eslint-disable-line
  }
}

async function makeComments(data) {
  for (const line of data) { //eslint-disable-line
    const {
      userid = '',
      articleid = '',
      title = '',
      comment = '',
    } = line;
    await postCommentQuery({ title, comment, articleId: articleid, id: userid }); //eslint-disable-line
  }
}

async function makeArticleLikes(data) {
  for (const line of data) { //eslint-disable-line
    const {
      userid = '',
      articleid = '',
      islike = '',
    } = line;
    await handleLikesQuery({ id: userid, columnId: articleid, isLike: islike, columnName: 'articleid', table: 'article_likes' }); //eslint-disable-line
  }
}

async function makeCommentLikes(data) {
  for (const line of data) { //eslint-disable-line
    const {
      userid = '',
      commentid = '',
      islike = '',
    } = line;
    await handleLikesQuery({ id: userid, columnId: commentid, isLike: islike, columnName: 'commentid', table: 'comment_likes' }); //eslint-disable-line
  }
}

async function main() {
  const users = await read(USERS_CSV);
  const parsedUsers = parse(users);
  await makeUsers(parsedUsers.data);

  const topics = await read(TOPICS_CSV);
  const parsedTopics = parse(topics);
  await makeTopics(parsedTopics.data);

  const articles = await read(ARTICLES_CSV);
  const parsedArticles = parse(articles);
  await makeArticles(parsedArticles.data);

  const comments = await read(COMMENTS_CSV);
  const parsedComments = parse(comments);
  await makeComments(parsedComments.data);

  const articleLikes = await read(ARTICLE_LIKES_CSV);
  const parsedArticleLikes = parse(articleLikes);
  await makeArticleLikes(parsedArticleLikes.data);

  const commentLikes = await read(COMMENT_LIKES_CSV);
  const parsedCommentLikes = parse(commentLikes);
  await makeCommentLikes(parsedCommentLikes.data);
}

main();
