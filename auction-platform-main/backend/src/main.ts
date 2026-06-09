import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Initializes and starts the NestJS application.
 *
 * This function performs the following key steps:
 * 1. Creates a NestJS application instance using the root `AppModule`.
 * 2. Enables Cross-Origin Resource Sharing (CORS) to allow requests from specified origins (e.g., `http://localhost:4200` for a frontend application).
 *    It configures allowed HTTP methods, credentials, and headers for CORS.
 * 3. Sets up Swagger documentation for the API.
 * 4. Retrieves the `ConfigService` to access environment variables, which are used for application configuration (e.g., database connection details, port number).
 * 5. Logs some of the database configuration details to the console (primarily for debugging purposes during development).
 * 6. Starts the application, making it listen for incoming HTTP requests on the port specified by the `PORT` environment variable,
 *    defaulting to port 3000 if `PORT` is not set.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:4200'], // Angular default port
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Auction Platform API')
    .setDescription('The Auction Platform API documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('items', 'Auction items management')
    .addTag('bids', 'Bidding operations')
    .addTag('users', 'User management')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      persistAuthorization: true,
    },
  });

  const configService = app.get(ConfigService);
  console.log("Database config:", {
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    database: configService.get('DB_NAME'),
  })
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();