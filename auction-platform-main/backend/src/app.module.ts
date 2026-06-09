import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ItemsModule } from './items/items.module';
import { BidsModule } from './bids/bids.module';
import { AuthModule } from './auth/auth.module';
import { Users } from './users/entities/user.entity';
import { Item } from './items/entities/item.entity';
import { Bid } from './bids/entities/bid.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * The root module of the application.
 * This module is responsible for:
 * - Setting up global configuration using `ConfigModule`.
 * - Establishing the database connection using `TypeOrmModule.forRootAsync`,
 *   which dynamically configures the connection based on environment variables
 *   loaded via `ConfigService` (e.g., DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME).
 * - Importing all feature modules: `UsersModule`, `ItemsModule`, `BidsModule`, and `AuthModule`.
 * - Registering the main application controller (`AppController`) and service (`AppService`).
 * The `synchronize: true` option in TypeORM configuration is typically used for development
 * and automatically creates the database schema on every application launch.
 * Logging is enabled for database operations.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [Users, Item, Bid],
        synchronize: true,
        logging: true,
        logger: 'advanced-console',
      }),
    }),
    UsersModule,
    ItemsModule,
    BidsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
