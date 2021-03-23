# Express - jsonwebtoken - Demo
This project was a simple demo project to exercise in JavaScript, Express and jsonwebtokens. Front-end for server has not been developed and the server has not been tested thoroughly so there might be some small bugs and inconsistancies in the code. \
The goal was to simply build a server using Express and use jsonwebtokens for authentication, mainly since there has been a while since I had the chance to write back-end code in javascript. 

# Setup

## Postgres

With postgres setup on Windows 10, the following commands we run to create a database for the server. There are some differences between postgres on windows and mac, so steps might vary. \
Open cmd and run

```bash
$ psql -U postgres
$ CREATE USER {your user} WITH ENCRYPTED PASSWORD '{your password}'
CREATE ROLE
$ CREATE DATABASE {your db name}
CREATE DATABASE
$ GRANT ALL PRIVILEGES ON DATABASE {your db name} TO {your user}
GRANT
```

## Setup Project

### Get Repository

Clone the repo

```bash
$ git clone https://github.com/arnar44/jwt-ws-demo.git
$ cd .\jwt-ws-demo\
```

### Install Packages
Use npm or yarn to install packages.

```bash
$ npm install
```

```bash
$ yarn install
```

### .env file
Create a .env file and set the following variables.

```bash
DATABASE_URL=postgres://{username}:{password}@localhost/{db name}
PORT={example: 3000}
JWT_SECRET={your secret}
TOKEN_LIFETIME={example: 1200000}
```

The JWT_SECRET can be anything, can use Node to generate a random secret string with:

```bash
$ node
$ require('crypto').randomBytes(64).toString('hex')
```

### Create DB
Run scripts to create db. Provided data in /data/*.csv files can be read and inserted into DB as temp data.

Create DB

```bash
$ node .\db\createdb.js
```

Read Data

```bash
$ node .\utils\csv2table.js
```

## Run

Use yarn or npm to run server. There are currently 3 scripts provided: \
'start', 'eslint' and 'dev'. \

```bash
$ npm start
```

Starts the server (runs node app.js). 

```bash
$ npm run dev
```

Starts the server in development mode (runs nodemon app.js). Nodemon detects changes is files and restarts node application, making development easier.

```bash
$ npm run eslint
```

Lints all js files and gives feedback where there are errors (runs eslint *.js **/*.js). I recommend having eslint extension in editor so syntax errors can be fixed live, otherwise script can be used. 

## Other

### Running instance
To extend the demo, the server was setup and is running on heroku. The link to the server is: https://jwt-ws-demo.herokuapp.com/

### Testing/Interacting
To test and interact with the server various tools can be used. In previous assignments I have used postman (https://www.postman.com/). For this demo I used a VSCode extension 'REST Client'. You can then create a .rest file and query the server directly in vsCode. Some examples of the requests I used can be found in requests/requests.rest. With the server running, requests can be sent by clicking "Send Request" above each of the requests in the file. 

