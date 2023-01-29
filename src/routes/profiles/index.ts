import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (): Promise<
    ProfileEntity[]
  > {
    return await this.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request): Promise<ProfileEntity> {
      const profile = await this.db.profiles.findOne({ key: 'id', equals: request.params.id });
      if (profile) {
        return profile;
      } 
      throw new Error('Profile not found');
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request): Promise<ProfileEntity> {
      const userPromise = this.db.users.findOne({ key: 'id', equals: request.body.userId });
      const memberTypePromise = this.db.memberTypes.findOne({ key: 'id', equals: request.body.memberTypeId });
      const profilePromise = this.db.profiles.findOne({ key: 'userId', equals: request.body.userId });

      const [user, member, profile] = await Promise.all([userPromise, memberTypePromise, profilePromise]);

      if (!user || !member || profile) {
          throw new Error('Bad request');
      }
      return await this.db.profiles.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request): Promise<ProfileEntity> {
      try {
        return await this.db.profiles.delete(request.params.id);
      } catch (error: any) {
          throw new Error(`Can\'t delete, ${JSON.stringify(error)}`);
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request): Promise<ProfileEntity> {
      try {
        return await this.db.profiles.change(
            request.params.id,
            request.body
        );
      } catch (error: any) {
        throw new Error(`Can\'t patch, ${JSON.stringify(error)}`);
    }
    }
  );
};

export default plugin;
