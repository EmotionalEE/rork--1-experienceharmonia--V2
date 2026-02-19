import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

class UserStore {
  private users: Map<string, User> = new Map();
  private initialized: boolean = false;

  async initialize() {
    if (this.initialized) {
      console.log('[UserStore] Already initialized');
      return;
    }
    
    console.log('[UserStore] Initializing with test user...');
    try {
      const testPassword = await bcrypt.hash('password123', 10);
      const testUser: User = {
        id: 'test_user_1',
        email: 'test@example.com',
        passwordHash: testPassword,
        name: 'Test User',
        createdAt: new Date().toISOString(),
      };
      this.users.set(testUser.id, testUser);
      this.initialized = true;
      console.log('[UserStore] Test user created: test@example.com');
      console.log('[UserStore] Total users:', this.users.size);
    } catch (error) {
      console.error('[UserStore] Initialization failed:', error);
      throw error;
    }
  }

  async createUser(email: string, password: string, name: string): Promise<User> {
    await this.initialize();

    const existingUser = Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      email: email.toLowerCase(),
      passwordHash,
      name,
      createdAt: new Date().toISOString(),
    };

    this.users.set(user.id, user);
    console.log('[UserStore] User created:', user.email);
    return user;
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    await this.initialize();
    const user = Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
    console.log(`[UserStore] findUserByEmail(${email}): ${user ? 'found' : 'not found'}`);
    console.log(`[UserStore] Total users in store: ${this.users.size}`);
    return user;
  }

  async findUserById(id: string): Promise<User | undefined> {
    await this.initialize();
    return this.users.get(id);
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async getAllUsers(): Promise<User[]> {
    await this.initialize();
    return Array.from(this.users.values());
  }
}

export const userStore = new UserStore();
