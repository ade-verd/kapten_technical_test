# Loyalty API

Requirements:
- [nvm](https://github.com/creationix/nvm#installation) or node 10.15

## Installation
``` bash
(optional) > nvm use
> npm install
```

## Launch tests
``` bash
> npm test
```

## Start API server (dev mode) with nodemon
``` bash
> npm run start:dev
```

## Start API server (production mode)
``` bash
> npm start
```

## Start the loyalty worker
``` bash
> npm run start:loyalty_worker
```

You can check the API by requesting the provided route:
[http://localhost:8000/api/rider/loyalty/000000000000000000000001](http://localhost:8000/api/rider/loyalty/000000000000000000000001) to 
check the provided API example route.

``` bash
curl -X GET \
  http://localhost:8000/api/rider/loyalty/000000000000000000000001
```

You should get a `404 Not Found` error since this rider obviously does not exist.
