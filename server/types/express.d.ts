import { User } from '@/src/database/schema/user.schema';

declare global {
  namespace Express {
    interface User extends User {
    }
  }
} 