# typescript-node-playground

Random things in Typescript, Express, REST, GraphQL and PostgreSQL

## Setup node & npm

```sh
# install nvm (node version manager)
brew install nvm

# install the latest LTS and make it the default
nvm install 10
nvm alias default 10
```

---

## Setup docker

Follow the install instructions for docker

#### Mac

https://docs.docker.com/docker-for-mac/

#### Windows

https://docs.docker.com/docker-for-windows/

---

## Setup Postgresql

```sh
# start the docker container for postgres
docker-compose up -d

# install the command line tools for postgres
brew install postgresql
```

---

## Install npm Dependecies

1. Run `npm i` from the root directory in a terminal window. Perform this step before running, testing, or building

## Running

1. Run `npm run dev` from the root directory in a terminal window

## Testing

1. Run `npm test` from the root directory in a terminal window

## Run from build

1. Run `npm run build` from the root directory in a terminal window
2. Run `npm start` from the root directory in a terminal window
