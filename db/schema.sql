create table topics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) UNIQUE NOT NULL
);

create table users ( 
    id SERIAL PRIMARY KEY,
    password VARCHAR(64) NOT NULL,
    username VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(64) NOT NULL,
    admin BOOLEAN NOT NULL,
    pending BOOLEAN NOT NULL
);

create table articles (
  id SERIAL PRIMARY KEY,
  userid INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic VARCHAR(64) NOT NULL REFERENCES topics(name) ON DELETE CASCADE,
  title VARCHAR(180) UNIQUE NOT NULL,
  article TEXT
);

create table comments (
  id SERIAL PRIMARY KEY,
  userid INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  
  articleid INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  title VARCHAR(64) NOT NULL,
  comment TEXT
);

create table article_likes (
  id SERIAL PRIMARY KEY,
  userid INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  articleid INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  islike BOOLEAN NOT NULL,
  CONSTRAINT article_uc_like UNIQUE (userid,articleid)
);

create table comment_likes (
  id SERIAL PRIMARY KEY,
  userid INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commentid INT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  islike BOOLEAN NOT NULL,
  CONSTRAINT comment_uc_like UNIQUE (userid,commentid)
);
