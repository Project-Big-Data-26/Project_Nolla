const crypto = require("crypto");

const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

const readClientId = (req, header) => {
  const value = req.get(header);
  return typeof value === "string" && CLIENT_ID_PATTERN.test(value)
    ? value
    : null;
};

// ID korelasi tanpa credential; nilai header yang tidak valid diabaikan.
const requestContext = (req, res, next) => {
  req.requestId =
    readClientId(req, "X-Request-Id") ?? `req_${crypto.randomUUID()}`;
  req.learningSessionId = readClientId(req, "X-Learning-Session-Id");
  req.pageInstanceId = readClientId(req, "X-Page-Instance-Id");
  res.set("X-Request-Id", req.requestId);
  next();
};

module.exports = { CLIENT_ID_PATTERN, requestContext };
