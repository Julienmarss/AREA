import { User } from '../types/user';

class UserStorage {
  private users: Map<string, User> = new Map();

  create(user: User): void {
    this.users.set(user.id, user);
  }

  findById(id: string): User | undefined {
    return this.users.get(id);
  }

  findByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  update(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  updateServices(id: string, service: 'github' | 'discord' | 'spotify' | 'google', data: any): User | undefined {

    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      services: {
        ...user.services,
        [service]: {
          ...data,
          connected: true,
          connectedAt: new Date()
        }
      }
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  delete(id: string): boolean {
    return this.users.delete(id);
  }

  getAll(): User[] {
    return Array.from(this.users.values());
  }

  count(): number {
    return this.users.size;
  }
}

export const userStorage = new UserStorage();