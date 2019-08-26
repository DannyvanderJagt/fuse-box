import { sparky, fusebox } from '../../src';
import * as path from 'path';
class Context {
  isProduction;
  runServer;
  getConfig() {
    return fusebox({
      target: 'browser',
      entry: 'src/index.tsx',
      webIndex: {
        template: 'src/index.html',
      },
      tsConfig: 'src/tsconfig.json',

      stylesheet: { paths: [path.join(__dirname, 'src/config')] },
      cache: false,

      watch: true,
      hmr: true,
      devServer: this.runServer && {
        open: false,
        httpServer: {
          express: app => {},
        },

        proxy: [
          {
            path: '/api',
            options: {
              target: 'https://jsonplaceholder.typicode.com',
              changeOrigin: true,
              pathRewrite: {
                '^/api': '/',
              },
            },
          },
        ],
      },
    });
  }
}
const { task, rm, exec } = sparky<Context>(Context);

task('default', async ctx => {
  ctx.runServer = true;
  const fuse = ctx.getConfig();
  await fuse.runDev();
});

task('preview', async ctx => {
  rm('./dist');
  ctx.runServer = true;
  ctx.isProduction = true;
  const fuse = ctx.getConfig();
  await fuse.runProd({
    uglify: false,
    cleanCSS: {
      compatibility: {
        properties: { urlQuotes: true },
      },
    },
  });
});
task('dist', async ctx => {
  rm('./dist');
  ctx.runServer = false;
  ctx.isProduction = true;
  const fuse = ctx.getConfig();
  await fuse.runProd({
    uglify: false,
    cleanCSS: {
      compatibility: {
        properties: { urlQuotes: true },
      },
    },
  });
});