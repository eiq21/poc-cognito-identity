const Koa = require("koa");
const cors = require("@koa/cors");
const koaBody = require("koa-body");
const log = require("fancy-log");
const path = require("path");
const koaSwagger = require("koa2-swagger-ui");
const yamljs = require("yamljs");

const { errorHandler, oauth } = require("./core");
const { router } = require("./routes");

const app = new Koa();

const file = path.join(__dirname, "./utils/open.api.documentation.yaml");
const spec = yamljs.load(file);
router.get(
  "/swagger",
  koaSwagger({ routePrefix: false, swaggerOptions: { spec } })
);

app
  .use(cors())
  .use(koaBody())
  .use(errorHandler)
  .use(router.routes())
  .use(router.allowedMethods());

function start() {
  app.listen(3000, async () => {
    log.info("Server listen into PORT 3000");
  });
}

start();
