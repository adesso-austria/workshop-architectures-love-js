import * as App from "./app";

App.create()
  .listen({
    port: process.env["PORT"] == null ? 8080 : parseInt(process.env["PORT"]),
  })
  .then((address) => console.log(`server up and running on ${address}`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
