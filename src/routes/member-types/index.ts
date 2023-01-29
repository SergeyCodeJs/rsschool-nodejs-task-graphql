import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (): Promise<
    MemberTypeEntity[]
  > {
    return await this.db.memberTypes.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request): Promise<MemberTypeEntity> {
      const memberType = await this.db.memberTypes.findOne({ key: 'id', equals: request.params.id });

        if (!memberType) {
            throw new Error('Not found');
        }

        return memberType;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request): Promise<MemberTypeEntity> {
      try {
        return await this.db.memberTypes.change(
            request.params.id,
            request.body
        );
    } catch (error: any) {
        throw new Error('Bad request', error);
    }
    }
  );
};

export default plugin;
