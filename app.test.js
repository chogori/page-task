const request = require("supertest");
expect = require("chai").expect;
const superagent = require("superagent");
const sinon = require("sinon");
const assert = require("assert");

const app = require("./index").app;

const generateItems = (page, perPage = 100) => {
  const numberOfObjects = 100;
  return [
    ...Array(numberOfObjects)
      .fill()
      .map((_, index) => ({
        absoluteIndex: (page - 1) * perPage + index,
        name: `item-${(page - 1) * perPage + index}`,
      })),
  ];
};

describe("Testing API with a mocked backend", function () {
  describe("should return validation error because page and perPage should be numbers", function () {
    it("should return validation error because page and perPage should be numbers", function (done) {
      request(app)
        .get(`/items?page=test&perPage=test`)
        .expect(400)
        .expect(
          'Error validating request query. "page" must be a number. "perPage" must be a number.'
        )
        .end(done);
    });
  });

  it("should return validation error because page and perPage should be numbers", function (done) {
    request(app)
      .get(`/items?page=test&perPage=123`)
      .expect(400)
      .expect('Error validating request query. "page" must be a number.')
      .end(done);
  });

  it("should return validation error because page and perPage should be numbers", function (done) {
    request(app)
      .get(`/items?page=123&perPage=qwe`)
      .expect(400)
      .expect('Error validating request query. "perPage" must be a number.')
      .end(done);
  });

  describe("should return valid results", function () {
    describe("page = 2 and perPage = 60, result should begin from 61 and end with 120", function () {
      it("should return first item with index = 61 and last item with index = 120 and array with result should have length equal 60", function (done) {
        const stub = sinon.stub(superagent, "get");
        stub
          .onFirstCall()
          .returns({ text: JSON.stringify({ data: generateItems(1) }) })
          .onSecondCall()
          .returns({ text: JSON.stringify({ data: generateItems(2) }) });

        request(app)
          .get(`/items?page=2&perPage=60`)
          .expect(200)
          .expect((response) => {
            const length = response.body.data.length;

            assert.equal(length, 60);

            assert.deepEqual(response.body.data[0], {
              absoluteIndex: 61,
              name: "item-61",
            });

            assert.deepEqual(response.body.data[length - 1], {
              absoluteIndex: 120,
              name: "item-120",
            });

            stub.restore();
          })
          .end(done);
      });
    });

    describe("page = 19 and perPage = 80, result should begin from 1441 and end with 1520", function () {
      it("should return first item with index = 1441 and last item with index = 1520 and result should have length equal 80", function (done) {
        const stub = sinon.stub(superagent, "get");
        stub
          .onFirstCall()
          .returns({ text: JSON.stringify({ data: generateItems(15) }) })
          .onSecondCall()
          .returns({ text: JSON.stringify({ data: generateItems(16) }) });

        request(app)
          .get(`/items?page=19&perPage=80`)
          .expect(200)
          .expect((response) => {
            const length = response.body.data.length;
            assert.equal(length, 80);

            assert.deepEqual(response.body.data[0], {
              absoluteIndex: 1441,
              name: "item-1441",
            });

            assert.deepEqual(response.body.data[length - 1], {
              absoluteIndex: 1520,
              name: "item-1520",
            });

            stub.restore();
          })
          .end(done);
      });
    });

    describe("page = 12 and perPage = 250, result should begin from 2751 and end with 3000", function () {
      it("should return first item with index = 2751 and last item with index = 3000 and result should have length equal 250", function (done) {
        const stub = sinon.stub(superagent, "get");
        stub
          .onFirstCall()
          .returns({ text: JSON.stringify({ data: generateItems(28) }) })
          .onSecondCall()
          .returns({ text: JSON.stringify({ data: generateItems(29) }) })
          .onThirdCall()
          .returns({ text: JSON.stringify({ data: generateItems(30) }) })
          .onCall(3)
          .returns({ text: JSON.stringify({ data: generateItems(31) }) });

        request(app)
          .get(`/items?page=12&perPage=250`)
          .expect(200)
          .expect((response) => {
            const length = response.body.data.length;
            assert.equal(length, 250);

            assert.deepEqual(response.body.data[0], {
              absoluteIndex: 2751,
              name: "item-2751",
            });

            assert.deepEqual(response.body.data[length - 1], {
              absoluteIndex: 3000,
              name: "item-3000",
            });

            stub.restore();
          })
          .end(done);
      });
    });
  });
});
