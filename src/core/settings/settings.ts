import 'dotenv/config';
import { SortDirectionInputDTO } from '../pagination/input-dto/sort-direction.input-dto';

export const SETTINGS = {
  PORT: Number(process.env.PORT || 5003),

  MONGO_URL: 'mongodb://localhost:27017/?maxPoolSize=50',
  DB_NAME: process.env.DB_NAME || '030-s-04-w-04-bloggers-app-hw',
  TEST_DB_NAME: process.env.DB_NAME || '030-s-04-w-04-bloggers-app-hw-test',

  APP_NAME_FOR_SWAGGER: 'Bloggers App Swagger API',

  BASIC_AUTH_ADMIN_LOGIN: String(process.env.BASIC_AUTH_ADMIN_LOGIN),
  BASIC_AUTH_ADMIN_PASSWORD: String(process.env.BASIC_AUTH_ADMIN_PASSWORD),
  AT_SECRET: String(process.env.AT_SECRET),
  AT_TIME: process.env.AT_TIME,
  RT_SECRET: String(process.env.RT_SECRET),
  RT_TIME: process.env.RT_TIME,

  GLOBAL_PREFIX: 'api',

  AUTH_PREFIX: 'auth',
  REGISTER_USER_PATH: 'registration',
  RESEND_CONFIRMATION_EMAIL_PATH: 'registration-email-resending',
  CONFIRM_USER_BY_CODE_PATH: 'registration-confirmation',
  SEND_PASSWORD_RECOVERY_CODE_PATH: 'password-recovery',
  SET_NEW_PASSWORD_BY_PASSWORD_RECOVERY_CODE_PATH: 'new-password',
  AUTH_USER_BY_LOGIN_OR_EMAIL_PATH: 'login',
  GET_USER_DATA_BY_ACCESS_TOKEN_PATH: 'me',

  USERS_PREFIX: 'users',
  CREATE_USER_PATH: '',
  GET_USER_LIST_PATH: '',
  DELETE_USER_BY_ID_PATH: ':id',

  BLOGS_PREFIX: 'blogs',
  CREATE_BLOG_PATH: '',
  CREATE_POST_FOR_BLOG_PATH: ':blogId/posts',
  GET_BLOG_BY_ID_PATH: ':id',
  GET_BLOG_LIST_PATH: '',
  GET_POST_LIST_BY_BLOG_ID_PATH: ':blogId/posts',
  UPDATE_BLOG_BY_ID_PATH: ':id',
  DELETE_BLOG_BY_ID_PATH: ':id',

  POSTS_PREFIX: 'posts',
  CREATE_POST_PATH: '',
  CREATE_COMMENT_FOR_POST_PATH: ':postId/comments',
  GET_POST_BY_ID_PATH: ':id',
  GET_POST_LIST_PATH: '',
  GET_COMMENT_LIST_BY_POST_ID_PATH: ':postId/comments',
  UPDATE_POST_BY_ID_PATH: ':id',
  LIKE_POST_BY_ID_PATH: ':id/like-status',
  DELETE_POST_BY_ID_PATH: ':id',

  COMMENTS_PREFIX: 'comments',
  GET_COMMENT_BY_ID_PATH: ':id',
  UPDATE_COMMENT_BY_ID_PATH: ':id',
  LIKE_COMMENT_BY_ID_PATH: ':id/like-status',
  DELETE_COMMENT_BY_ID_PATH: ':id',

  TESTING_PREFIX: 'testing',
  CLEAR_DB_PATH: 'all-data',

  DEFAULT_PAGINATION_PAGE_NUMBER: 1,
  DEFAULT_PAGINATION_PAGE_SIZE: 10,
  DEFAULT_PAGINATION_SORT_DIRECTION: SortDirectionInputDTO.Desc,

  APP_NAME_FOR_NOTIFICATION_MODULE: '"Bloggers App"',
  EMAIL: process.env.EMAIL,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_APP_PASS: process.env.EMAIL_APP_PASS,

  CONFIRMATION_REGISTRATION_CODE_EXPIRATION_TIME: {
    minutes: Number(process.env.CONFIRMATION_REGISTRATION_CODE_EXPIRATION_TIME),
  },
  CONFIRMATION_REGISTRATION_CODE_EXPIRATION_TIME_IN_DB_IN_SECONDS: Number(
    process.env.CONFIRMATION_REGISTRATION_CODE_EXPIRATION_TIME_IN_DB_IN_SECONDS
  ),

  PASSWORD_RECOVERY_CODE_EXPIRATION_TIME: { minutes: Number(process.env.PASSWORD_RECOVERY_CODE_EXPIRATION_TIME) },
  PASSWORD_RECOVERY_CODE_EXPIRATION_TIME_IN_DB_IN_SECONDS: Number(
    process.env.PASSWORD_RECOVERY_CODE_EXPIRATION_TIME_IN_DB_IN_SECONDS
  ),
};
