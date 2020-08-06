const express = require("express");
const app = express();
const superagent = require("superagent");
const bodyParser = require("body-parser");
const validator = require("express-joi-validation").createValidator({});
const joi = require("joi");
const PORT = process.env.PORT || 3000;
const BACKEND_HOST = process.env.BACKEND_HOST;
const { isEmpty, pipe, prop, unnest, andThen } = require("ramda");
const bluebird = require("bluebird");
const CONCURRENCY = 10 || process.env.CONCURRENCY;

const calculateNumberOfRequestsAndOffset = (page, perPage) => {
  const offset = (page - 1) * perPage;
  const limit = perPage;

  const startPositionForRequests = Math.floor(offset / 100);
  const endPositionForRequests = Math.ceil((offset + limit) / 100);

  return {
    startPositionForRequests,
    endPositionForRequests,
    offset,
  };
};

const range = (start, end) => {
  return Array(end - start)
    .fill()
    .map((_, idx) => start + idx + 1);
};

const processResponse = pipe(prop("text"), JSON.parse, prop("data"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const validationSchema = joi.object().keys({
  page: joi.number().integer().positive().required(),
  perPage: joi.number().integer().positive().required(),
});

const response = async (req, res) => {
  const { page, perPage } = req.query;

  const {
    startPositionForRequests,
    endPositionForRequests,
    offset,
  } = calculateNumberOfRequestsAndOffset(page, perPage);

  const parsedResponseFromBackend = unnest(
    await bluebird.map(
      [...range(startPositionForRequests, endPositionForRequests)],
      async (_) =>
        pipe(
          (_) => superagent.get(`${BACKEND_HOST}?page=${_}`),
          andThen(processResponse)
        )(_),
      {
        concurrency: CONCURRENCY,
      }
    )
  );

  if (isEmpty(parsedResponseFromBackend)) {
    return res.json({
      perPage,
      page,
      data: [],
    });
  }

  const offsetIndex = parsedResponseFromBackend.findIndex(
    ({ absoluteIndex }) => absoluteIndex >= offset
  );

  finalResponse = parsedResponseFromBackend.slice(
    offsetIndex,
    offsetIndex + perPage
  );

  return res.json({
    perPage,
    page,
    data: finalResponse,
  });
};

app.get("/items", validator.query(validationSchema), response);

app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
});

module.exports = {
  app,
};
