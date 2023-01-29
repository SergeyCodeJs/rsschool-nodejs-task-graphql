import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (): Promise<UserEntity[]> {
    return await this.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request): Promise<UserEntity> {
      const user = await this.db.users.findOne({ key: 'id', equals: request.params.id });
      if (user) {
        return user;
      }
      throw new Error('User not found');
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request): Promise<UserEntity> {
      return await this.db.users.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request): Promise<UserEntity> {
      try {
        const deletedUser = await this.db.users.delete(request.params.id);
        
        const userPosts = await this.db.posts.findMany({
          key: 'userId', equals: deletedUser.id 
        });
        userPosts.forEach(post => this.db.posts.delete(post.id));

        const userProfiles = await this.db.profiles.findMany({ 
          key: 'userId', 
          equals: deletedUser.id 
        });
        userProfiles.forEach(profile => this.db.profiles.delete(profile.id));

        const userSubscribers = await this.db.users.findMany({ 
          key: 'subscribedToUserIds', 
          inArray: deletedUser.id 
        });

        userSubscribers.forEach(subscriber => {
          const subscriberIndex = subscriber.subscribedToUserIds.indexOf(deletedUser.id, 1);
          if (subscriberIndex !== -1) {
            subscriber.subscribedToUserIds.splice(subscriberIndex);
          }
          this.db.users.change(subscriber.id, subscriber);
        });

        return deletedUser;
    } catch (error: any) {
        throw new Error(`User delete failed, ${JSON.stringify(error)}`);
    }
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request): Promise<UserEntity> {
      const subscribeToPromise = this.db.users.findOne({ key: 'id', equals: request.params.id });
      const subscriberPromise = this.db.users.findOne({ key: 'id', equals: request.body.userId });

      const [subscribeTo, subscriber] = await Promise.all([subscribeToPromise, subscriberPromise]);
      
      if (!subscriber) {
        throw new Error('There is no subscriber');
      }

      if (!subscribeTo) {
        throw new Error('There is no subscribeTo');
      }
      let subscribedIds = subscriber.subscribedToUserIds;
      if (subscribedIds.indexOf(subscribeTo.id) !== -1) {
        subscribedIds = [...subscribedIds, subscribeTo.id];
      }
      this.db.users.change(subscriber.id, subscriber);

      return subscriber;
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request): Promise<UserEntity> {
      const unsubscribeFromPromise = this.db.users.findOne({ key: 'id', equals: request.params.id });
      const subscriberPromise = this.db.users.findOne({ key: 'id', equals: request.body.userId });

      const [unsubscribeFrom, subscriber] = await Promise.all([unsubscribeFromPromise, subscriberPromise]);

      if (!subscriber) {
          throw new Error('There is no subscriber');
      }

      if (!unsubscribeFrom) {
        throw new Error('There is no unsubscribeFrom');
    }

      let unsubscribedIndex = subscriber.subscribedToUserIds.indexOf(unsubscribeFrom.id);
      if (unsubscribedIndex !== -1) {
        throw new Error('No such subscription');
      };
      subscriber.subscribedToUserIds.splice(unsubscribedIndex, 1);
      this.db.users.change(subscriber.id, subscriber);
      return subscriber;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request): Promise<UserEntity> {
      try {
        return await this.db.users.change(
            request.params.id,
            request.body
        );
    } catch (error: any) {
        throw new Error(`Patch is not successful, ${JSON.stringify(error)}`);
    }
    }
  );
};

export default plugin;
