import { join } from 'path';
import AutoLoad from '@fastify/autoload';
import { FastifyPluginAsync } from 'fastify';

const app: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: {},
  });

  fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: {},
  });

  fastify.setErrorHandler((error, req, res) => {
    if (!error.statusCode) {
      req.log.error(error);
      res.code(500).send({ error: 'Internal Server Error' });
      return
    }
    if (String(error.statusCode).startsWith('4')) {
      req.log.error(error);
    }
    res.code(error.statusCode).send(error);
});
};

export default app;
