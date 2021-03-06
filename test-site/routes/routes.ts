import * as path from 'path';
import * as mime from 'mime-types';
import * as fs from 'fs';
import express from 'express';

export const appRouter = (app: any): void => {
  const usersPath = path.join(__dirname, "..", "data", "users.json");
  const sitePath = path.join(__dirname, "..", "data", "site.html");
  // READ
  app.get("/users", (req: express.Request, res: express.Response) => {
    setTimeout(() => {
      fs.readFile(usersPath, "utf8", (err, data) => {
        if (err) {
          throw err;
        }

        res.contentType('application/json');
        res.send(data);
      });
    }, 1000);
  });

  app.get("/site", (req: express.Request, res: express.Response) => {
    setTimeout(() => {
      fs.readFile(sitePath, "utf8", (err, data) => {
        if (err) {
          throw err;
        }

        res.contentType('text/html');
        res.send(data);
      });
    }, 2000);
  });

  app.post('/users', (req: express.Request, res: express.Response) => {
    res.contentType('application/json');
    res.end(JSON.stringify({ msg: 'success' }));
  });

  app.get("/*", (req: express.Request, res: express.Response) => {
    const file = path.join(__dirname, "..", "html", req.url);

    if (!res.getHeader("content-type")) {
      const charset = mime.lookup(path.extname(req.url));
      res.setHeader("Content-Type", charset as string);
    }

    res.sendFile(file);
  });
};

