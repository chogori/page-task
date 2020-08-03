const express = require("express");
const app = express();
const superagent = require("superagent");
const bodyParser = require("body-parser");
const validator = require("express-joi-validation").createValidator({});
const joi = require("joi");
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
const BACKEND_HOST = process.env.BACKEND_HOST;
const r = require("ramda");

const calculateNumberOfRequestsAndOffset = (page, perPage) => {
  const offset = (page - 1) * perPage + 1;
  const limit = perPage;

  const startPositionForRequests = Math.floor(offset / 100);
  const endPositionForRequests = Math.ceil((offset + limit) / 100);

  return {
    startPositionForRequests,
    endPositionForRequests,
    offset,
  };
};

function range(start, end) {
  return Array(end - start)
    .fill()
    .map((_, idx) => start + idx + 1);
}

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

  const parsedResponseFromBackend = r.unnest(
    await Promise.all(
      [...range(startPositionForRequests, endPositionForRequests)].map(
        async (_) => {
          const { text } = await superagent.get(`${BACKEND_HOST}?page=${_}`);

          return r.pipe(JSON.parse, r.prop("data"))(text);
        }
      )
    )
  );

  if (r.isEmpty(parsedResponseFromBackend)) {
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
