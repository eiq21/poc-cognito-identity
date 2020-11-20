const toResponse = (status, params) => {
  const { message, detail } = params;

  return {
    status,
    message,
    detail,
  };
};

class ResponseError {
  static notFound(ctx) {
    ctx.status = 404;
    ctx.body = toResponse(ctx.status, {
      message: "Not Found",
      detail: "",
    });
    return ctx.body;
  }

  static internalServerError(ctx, err) {
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = toResponse(ctx.status, {
      message: err.message,
      detail: err.stack,
    });
    return ctx.body;
  }
}

const errorHandler = async (ctx, next) => {
  try {
    await next();
    if (!ctx.body && (!ctx.status || ctx.status === 404)) {
      return ResponseError.notFound(ctx);
    }
  } catch (err) {
    return ResponseError.internalServerError(ctx, err);
  }
};

module.exports = { errorHandler }
