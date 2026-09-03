import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './api/auth/auth.controller';
import { UsersController } from './api/users/users.controller';
import { AuthService } from './application/auth/auth.service';
import { UsersService } from './application/users/users.service';
import { AuthQueryService } from './application/auth/auth.query-service';
import { UsersQueryService } from './application/users/users.query-service';
import { AuthRepository } from './infrastructure/auth/auth.repository';
import { UsersRepository } from './infrastructure/users/users.repository';
import { UsersQueryRepository } from './infrastructure/users/users.query-repository';
import { CoreModule } from '../../core/core.module';
import { JwtAuthStrategy } from '../../core/guards/jwt-auth/jwt-auth.strategy';
import { LocalAuthStrategy } from '../../core/guards/local-auth/local-auth.strategy';
import { EmailConfirmation, EmailConfirmationSchema } from './domain/auth/email-confirmation.entity';
import {
  PasswordRecoveryCodeData,
  PasswordRecoveryCodeDataSchema,
} from './domain/auth/password-recovery-code-data.entity';
import { User, UserSchema } from './domain/users/user.entity';
import { PassportModule } from '@nestjs/passport';

/*Модуль для пользователей.*/
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: EmailConfirmation.name, schema: EmailConfirmationSchema },
      { name: PasswordRecoveryCodeData.name, schema: PasswordRecoveryCodeDataSchema },
    ]),
    CoreModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    LocalAuthStrategy,
    JwtAuthStrategy,
    JwtService,
    AuthService,
    UsersService,
    AuthQueryService,
    UsersQueryService,
    AuthRepository,
    UsersRepository,
    UsersQueryRepository,
  ],
  exports: [JwtAuthStrategy, AuthService, UsersService],
})
export class UserModule {}
