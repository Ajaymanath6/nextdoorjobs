# Service Layer Quick Start Guide

## For Developers: How to Use the Service Layer

### Quick Reference

```javascript
// Import services
import { gigService } from '@/lib/services/gig.service';
import { userService } from '@/lib/services/user.service';
import { locationService } from '@/lib/services/location.service';

// Use in API routes
export async function GET(request) {
  const user = await getCurrentUser();
  const gigs = await gigService.getUserGigs(user.id);
  return NextResponse.json({ success: true, gigs });
}
```

## Common Patterns

### 1. Get Data (with automatic caching)

```javascript
// Get user
const user = await userService.getUserById(userId);

// Get gigs by location
const gigs = await gigService.getGigsByLocation({
  state: 'Kerala',
  district: 'Kochi',
  pincode: '682001'
});

// Get localities
const localities = await locationService.getAllLocalities('Kerala');
```

### 2. Create/Update Data (with cache invalidation)

```javascript
// Create gig (automatically invalidates user's gigs cache)
const gig = await gigService.createGig(userId, {
  title: 'Plumber needed',
  serviceType: 'Plumbing',
  state: 'Kerala',
  district: 'Kochi',
  // ... other fields
});

// Update user (automatically invalidates user cache)
const updated = await userService.updateUser(userId, {
  name: 'New Name',
  accountType: 'Company'
});
```

### 3. API Route Pattern

```javascript
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { myService } from '@/lib/services/my.service';

export async function GET(request) {
  try {
    // 1. Auth check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');

    // 3. Call service
    const data = await myService.getData(user.id, filter);

    // 4. Return response
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

## Creating a New Service

### Step 1: Create Service File

```javascript
// lib/services/example.service.js
import { prisma } from '../prisma';
import { cacheService } from './cache.service';

class ExampleService {
  // Read with caching
  async getById(id) {
    return cacheService.wrap(
      `example:id:${id}`,
      300, // 5 min TTL
      () => prisma.example.findUnique({ where: { id } })
    );
  }

  // Write with cache invalidation
  async create(data) {
    const item = await prisma.example.create({ data });
    await cacheService.del(`examples:all`);
    return item;
  }
}

export const exampleService = new ExampleService();
```

### Step 2: Use in API Route

```javascript
// app/api/example/route.js
import { exampleService } from '@/lib/services/example.service';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  const data = await exampleService.getById(parseInt(id));
  return NextResponse.json({ success: true, data });
}
```

## Cache TTL Guidelines

| Data Type | TTL | Use Case |
|-----------|-----|----------|
| 1 hour | Static data (localities, pincodes) |
| 15 min | User profiles (changes infrequently) |
| 5 min | Dynamic content (gigs, jobs) |
| 1 min | Real-time data (notifications) |

## Cache Key Naming Convention

```
{resource}:{identifier}:{value}
```

**Examples:**
- `user:id:123`
- `user:email:user@example.com`
- `gigs:user:123`
- `gigs:location:Kerala:Kochi:all`
- `localities:Kerala`

## Cache Invalidation Patterns

### Single Key
```javascript
await cacheService.del('user:id:123');
```

### Multiple Related Keys
```javascript
await cacheService.del(`gigs:user:${userId}`);
await cacheService.del(`user:id:${userId}`);
```

### Pattern-Based
```javascript
await cacheService.delPattern('gigs:location:*');
await cacheService.delPattern('user:*');
```

## Environment Setup

### Development (Redis optional)
```env
# .env.local
# Leave REDIS_URL unset - will use in-memory cache
DATABASE_URL=postgresql://...
```

### Production (Redis required)
```env
# .env.production
REDIS_URL=redis://user:password@host:6379
DATABASE_URL=postgresql://...
```

## Debugging

### Check if Redis is connected
```javascript
import { redis } from '@/lib/redis';

if (redis) {
  console.log('✅ Redis connected');
} else {
  console.log('⚠️  Using memory cache');
}
```

### View cache in Redis CLI
```bash
redis-cli

# List all keys
KEYS *

# Get value
GET "user:id:123"

# Delete key
DEL "user:id:123"

# Clear all cache
FLUSHDB
```

## Common Mistakes to Avoid

### ❌ Don't put business logic in routes
```javascript
// BAD
export async function GET() {
  const data = await prisma.example.findMany({
    where: { complex: 'logic' },
    include: { nested: true },
  });
  return NextResponse.json(data);
}
```

### ✅ Do use services
```javascript
// GOOD
export async function GET() {
  const data = await exampleService.getAll();
  return NextResponse.json(data);
}
```

### ❌ Don't forget cache invalidation
```javascript
// BAD
async updateUser(id, data) {
  return await prisma.user.update({ where: { id }, data });
  // Cache is now stale!
}
```

### ✅ Do invalidate cache on writes
```javascript
// GOOD
async updateUser(id, data) {
  const user = await prisma.user.update({ where: { id }, data });
  await cacheService.del(`user:id:${id}`);
  return user;
}
```

### ❌ Don't use inconsistent cache keys
```javascript
// BAD - inconsistent naming
await cacheService.set(`user_${id}`, data);
await cacheService.set(`users:${id}`, data);
```

### ✅ Do use consistent naming
```javascript
// GOOD - consistent pattern
await cacheService.set(`user:id:${id}`, data);
await cacheService.set(`user:email:${email}`, data);
```

## Performance Tips

1. **Use cache wrapper pattern** - Simplest and most reliable
   ```javascript
   return cacheService.wrap(key, ttl, fetchFn);
   ```

2. **Set appropriate TTLs** - Balance freshness vs. performance
   - Static data: 1 hour
   - User data: 15 min
   - Dynamic data: 5 min

3. **Invalidate broadly on writes** - Better to over-invalidate than serve stale data
   ```javascript
   await cacheService.delPattern('gigs:*'); // Clears all gig caches
   ```

4. **Monitor cache hit rates** - Add logging to track effectiveness
   ```javascript
   console.log(`Cache hit: ${key}`);
   ```

## Need Help?

- 📖 Full documentation: `docs/SERVICE_LAYER.md`
- 📋 Implementation details: `docs/IMPLEMENTATION_SUMMARY.md`
- 💬 Ask the team in #backend channel

## Checklist for New Service

- [ ] Create service class in `lib/services/`
- [ ] Implement methods with cache wrapper pattern
- [ ] Add cache invalidation on write operations
- [ ] Use consistent cache key naming
- [ ] Set appropriate TTLs
- [ ] Update API route to use service
- [ ] Test with and without Redis
- [ ] Document any special behavior

---

**Quick Start Version:** 1.0
**Last Updated:** February 2026
