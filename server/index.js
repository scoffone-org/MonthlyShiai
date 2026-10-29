import { openDatabase } from './db.js';
import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3000;
const db = await openDatabase();
const server = createApp(db).listen(port, () => {
  console.log(`MonthlyShiai server listening on http://localhost:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close();
    db.close().finally(() => process.exit(0));
  });
}
