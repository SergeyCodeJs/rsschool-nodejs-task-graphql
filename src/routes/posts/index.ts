import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (): Promise<PostEntity[]> {
    return await this.db.posts.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request): Promise<PostEntity> {
      const post = await this.db.posts.findOne({ key: 'id', equals: request.params.id });
      if (post) {
        return post
      } else {
        throw new Error('Post not found');
      }
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request): Promise<PostEntity> {
      const user = await this.db.users.findOne({ key: 'id', equals: request.body.userId });
      if (user) {
        return await this.db.posts.create(request.body);
      } else {
        throw new Error('There is no such user');
      }
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request): Promise<PostEntity> {
      try {
        return await this.db.posts.delete(request.params.id);
    } catch (e: any) {
        throw new Error(`Delete operation failed, ${JSON.stringify(e)}`);
    }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request): Promise<PostEntity> {
      try {
        return await this.db.posts.change(
            request.params.id,
            request.body
        );
      } catch (error: any) {
          throw new Error(`Post can not be changed, ${JSON.stringify(error)}`);
      }
    }
  );
};

export default plugin;
