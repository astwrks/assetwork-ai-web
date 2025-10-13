# 🚀 Neon Database - Quick Start

## ✅ Setup Complete!

Your Neon PostgreSQL database is ready to use. Here's everything you need to get started.

---

## 📊 Database Status

```
✅ Connected to: Neon PostgreSQL 17.5
✅ Tables Created: 11
✅ Prisma Client: Generated
✅ Connection: Tested
```

---

## 🎯 Quick Commands

### Test Connection
```bash
npm run db:test
```

### Open Database Browser (Prisma Studio)
```bash
npm run db:studio
```
Then visit: **http://localhost:5555**

### Push Schema Changes
```bash
npm run db:push
```

### Generate Prisma Client
```bash
npm run db:generate
```

---

## 💻 Using Prisma in Your Code

### 1. Import Prisma Client
```typescript
import prisma from '@/lib/db/prisma';
```

### 2. Create a User
```typescript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    plan: 'FREE',
  },
});
```

### 3. Find a User
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});
```

### 4. Update a User
```typescript
const user = await prisma.user.update({
  where: { email: 'user@example.com' },
  data: { plan: 'PRO' },
});
```

### 5. Delete a User
```typescript
await prisma.user.delete({
  where: { id: userId },
});
```

---

## 📋 Available Models

You can use these models with Prisma:

- `prisma.user` - Users
- `prisma.thread` - Report threads
- `prisma.message` - Messages
- `prisma.template` - Templates
- `prisma.report` - Reports
- `prisma.reportSection` - Report sections
- `prisma.apiKey` - API keys
- `prisma.query` - Query history
- `prisma.widget` - Widgets
- `prisma.playgroundSettings` - Settings

---

## 🔄 MongoDB to Prisma Migration

### Old Way (MongoDB)
```typescript
import User from '@/lib/db/models/User';

const user = await User.findOne({ email: 'user@example.com' });
```

### New Way (Prisma)
```typescript
import prisma from '@/lib/db/prisma';

const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});
```

### Key Differences
- `_id` → `id`
- `ObjectId` → `string` (CUID)
- `.findOne()` → `.findUnique()`
- `.find()` → `.findMany()`
- `.create()` stays the same
- `.updateOne()` → `.update()`
- `.deleteOne()` → `.delete()`

---

## 🛠️ Common Operations

### Query with Relations
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: {
    threads: true,
    templates: true,
  },
});
```

### Create with Relations
```typescript
const thread = await prisma.thread.create({
  data: {
    title: 'My Report',
    description: 'A financial report',
    user: {
      connect: { id: userId },
    },
  },
});
```

### Count Records
```typescript
const userCount = await prisma.user.count();
```

### Pagination
```typescript
const users = await prisma.user.findMany({
  skip: 10,
  take: 10,
  orderBy: { createdAt: 'desc' },
});
```

### Search
```typescript
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: 'example',
    },
  },
});
```

---

## 🎨 Prisma Studio

Visual database browser - perfect for development!

```bash
npm run db:studio
```

**Features**:
- ✨ View all tables
- ✏️ Edit records
- ➕ Create new records
- 🔍 Search and filter
- 🔗 Navigate relationships

---

## 📚 Documentation Links

- **Full Setup Guide**: `NEON_DATABASE_SETUP.md`
- **Prisma Docs**: https://www.prisma.io/docs
- **Neon Dashboard**: https://console.neon.tech

---

## 🔧 Environment Variables

Configured in `.env` and `.env.local`:

```bash
DATABASE_URL="postgresql://neondb_owner:npg_ovqdftT4bR5y@ep-young-thunder-ad70ggph-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

---

## 🚨 Need Help?

### Connection Issues
```bash
npm run db:test
```

### Schema Issues
```bash
npm run db:generate
```

### View Logs
Prisma logs queries in development mode automatically.

---

## 🎉 You're Ready!

Start using Neon in your application:

```typescript
import prisma from '@/lib/db/prisma';

// Your code here
const users = await prisma.user.findMany();
```

---

**Database**: ✅ Active
**Tables**: ✅ Created (11)
**Client**: ✅ Generated
**Status**: 🚀 Ready to use!
