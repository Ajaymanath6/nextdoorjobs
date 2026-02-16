# Service Layer Architecture

## Overview

This document describes the service layer architecture implemented in NextDoorJobs. The service layer provides a clean separation between API routes (presentation layer) and data access (Prisma), with built-in caching support via Redis.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│              (React Components, Pages)                       │
└────────────────────────┬────────────────────────────────────┘
                         │ fetch()
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes Layer                          │
│         (app/api/*/route.js - Thin Controllers)             │
│  • Request validation                                        │
│  • Authentication checks                                     │
│  • Call service methods                                      │
│  • Format responses                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer (NEW)                        │
│              (lib/services/*.service.js)                     │
│  • Business logic                                            │
│  • Data validation                                           │
│  • Cache management                                          │
│  • Database queries via Prisma                               │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌──────────────────────┐    ┌──────────────────────┐
│   CacheService       │    │   Prisma Client      │
│   (Redis/Memory)     │    │   (PostgreSQL)       │
└──────────────────────┘    └──────────────────────┘
```

## Benefits

1. **Separation of Concerns**: API routes handle HTTP, services handle business logic
2. **Reusability**: Services can be called from multiple routes or other services
3. **Testability**: Services can be unit tested independently
4. **Caching**: Centralized caching strategy with automatic invalidation
5. **Maintainability**: Clear structure makes code easier to understand and modify
6. **Scalability**: Caching reduces database load, preparing for horizontal scaling

## Directory Structure

```
lib/
├── redis.js                          # Redis client singleton
└── services/
    ├── cache.service.js              # Centralized caching (Redis + memory fallback)
    ├── gig.service.js                # Gig business logic
    ├── user.service.js               # User business logic
    ├── location.service.js           # Location/pincode business logic
    ├── onboarding.service.js         # Onboarding business logic
    ├── company.service.js            # Company CRUD with caching
    ├── job.service.js                # Job titles, colleges, positions
    └── auth.service.js               # Authentication logic

app/api/
├── gigs/route.js                     # Uses GigService
├── profile/route.js                  # Uses UserService
├── localities/route.js               # Uses LocationService
├── onboarding/
│   ├── user/route.js                 # Uses OnboardingService
│   ├── company/route.js              # Uses CompanyService
│   └── job-position/route.js         # Uses JobService
├── job-titles/route.js               # Uses JobService
├── colleges/route.js                 # Uses JobService
├── auth/me/route.js                  # Uses AuthService
└── pincodes/
    ├── by-pincode/route.js           # Uses LocationService
    └── by-district/route.js          # Uses LocationService
```

## Core Components

### 1. Redis Client (`lib/redis.js`)

Singleton Redis client with:
- Automatic reconnection
- Lazy connection (connects on first use)
- Graceful fallback if Redis unavailable
- Connection pooling

**Environment Variable:**
```env
REDIS_URL=redis://localhost:6379
```

**Usage:**
```javascript
import { redis } from '../redis';

if (redis) {
  await redis.set('key', 'value');
}
```

### 2. CacheService (`lib/services/cache.service.js`)

Centralized caching with Redis and in-memory fallback.

**Key Methods:**
- `get(key)` - Retrieve cached value
- `set(key, value, ttlSeconds)` - Cache value with TTL
- `del(key)` - Delete cached value
- `delPattern(pattern)` - Delete keys matching pattern (e.g., `user:*`)
- `wrap(key, ttlSeconds, fetchFn)` - Cache wrapper pattern

**Example:**
```javascript
import { cacheService } from './cache.service';

// Cache wrapper pattern (recommended)
const data = await cacheService.wrap(
  'users:123',
  300, // 5 minutes
  async () => {
    return await prisma.user.findUnique({ where: { id: 123 } });
  }
);

// Manual caching
await cacheService.set('key', { foo: 'bar' }, 600);
const value = await cacheService.get('key');
await cacheService.del('key');
```

### 3. Service Classes

#### GigService (`lib/services/gig.service.js`)

Handles gig operations with caching.

**Methods:**
- `createGig(userId, data)` - Create gig, invalidate user cache
- `getUserGigs(userId)` - Get user's gigs (cached 5 min)
- `getGigsByLocation(filters)` - Get gigs by location (cached 5 min)
- `getGigById(id)` - Get single gig (cached 10 min)

**Cache Keys:**
- `gigs:user:{userId}` - User's gigs
- `gigs:location:{state}:{district}:{pincode}` - Location-filtered gigs
- `gig:id:{id}` - Single gig

**Cache Invalidation:**
- On `createGig`: Clears user's gigs cache and location caches

**Example:**
```javascript
import { gigService } from '../../../lib/services/gig.service';

// In API route
const gigs = await gigService.getUserGigs(userId);
```

#### UserService (`lib/services/user.service.js`)

Handles user operations with caching.

**Methods:**
- `getUserById(id, options)` - Get user by ID (cached 15 min)
- `getUserByEmail(email, options)` - Get user by email (cached 15 min)
- `updateUser(id, data)` - Update user, invalidate cache
- `updateAvatar(id, avatarId, avatarUrl)` - Update avatar, invalidate cache
- `createUser(data)` - Create new user

**Cache Keys:**
- `user:id:{id}` - User by ID
- `user:email:{email}` - User by email

**Cache Invalidation:**
- On `updateUser` or `updateAvatar`: Clears both ID and email caches

**Example:**
```javascript
import { userService } from '../../../lib/services/user.service';

// In API route
const user = await userService.getUserById(userId);
const updated = await userService.updateUser(userId, { name: 'New Name' });
```

#### LocationService (`lib/services/location.service.js`)

Handles location/pincode queries with long-term caching (static data).

**Methods:**
- `getAllLocalities(state)` - Get all localities (cached 1 hour)
- `getPincodeInfo(pincode)` - Get pincode details (cached 1 hour)
- `getDistrictPincodes(district, state)` - Get district pincodes (cached 1 hour)
- `searchLocalities(query, state)` - Search localities (not cached)

**Cache Keys:**
- `localities:{state}` - All localities for state
- `pincode:{pincode}` - Single pincode info
- `pincodes:district:{district}:state:{state}` - District pincodes

**Example:**
```javascript
import { locationService } from '../../../lib/services/location.service';

// In API route
const localities = await locationService.getAllLocalities('Kerala');
const pincodeInfo = await locationService.getPincodeInfo('695001');
const districtPincodes = await locationService.getPincodesByDistrict('Kochi', 'Kerala', 4);
```

#### OnboardingService (`lib/services/onboarding.service.js`)

Handles user onboarding operations with validation.

**Methods:**
- `createOrUpdateUser(data)` - Create or update user during onboarding
- `getUserByEmail(email, options)` - Get user with optional Clerk linkage
- `hashPassword(password)` - Hash password with bcrypt
- `validateEmail(email)` - Validate email format
- `validatePassword(password)` - Validate password strength
- `createSessionToken(userId)` - Generate session token

**Cache Strategy:**
- Delegates to `UserService` for user caching
- No additional caching needed

**Example:**
```javascript
import { onboardingService } from '../../../lib/services/onboarding.service';

// In API route
const result = await onboardingService.createOrUpdateUser({
  email: 'user@example.com',
  name: 'John Doe',
  password: 'secret123',
});
```

#### CompanyService (`lib/services/company.service.js`)

Handles company CRUD operations with caching.

**Methods:**
- `createCompany(userId, data)` - Create company with validation
- `getCompanyById(id)` - Get company by ID (cached 15 min)
- `getCompaniesByUser(userId)` - Get user's companies (cached 10 min)
- `updateCompany(id, data)` - Update company with cache invalidation
- `findCompanyByUserAndName(userId, name)` - Idempotent lookup

**Cache Keys:**
- `company:id:{id}` - Single company (15 min TTL)
- `companies:user:{userId}` - User's companies (10 min TTL)

**Cache Invalidation:**
- On create/update: Clears user's companies cache and specific company cache

**Example:**
```javascript
import { companyService } from '../../../lib/services/company.service';

// In API route
const company = await companyService.createCompany(userId, {
  name: 'Tech Corp',
  state: 'Kerala',
  district: 'Kochi',
});
```

#### JobService (`lib/services/job.service.js`)

Handles job titles, colleges, and job positions with caching.

**Methods:**
- `getAllJobTitles(query)` - Get all job titles with optional search (cached 1 hour)
- `getAllColleges(query)` - Get all colleges with optional search (cached 1 hour)
- `createJobPosition(data)` - Create job position
- `getJobPositionsByCompany(companyId)` - Get company's job positions (cached 10 min)

**Cache Keys:**
- `jobtitles:all` - All job titles (1 hour TTL)
- `colleges:all` - All colleges (1 hour TTL)
- `jobpositions:company:{companyId}` - Company's job positions (10 min TTL)

**Cache Invalidation:**
- Job titles/colleges: Static data, rarely invalidated
- Job positions: Clear company cache on create

**Example:**
```javascript
import { jobService } from '../../../lib/services/job.service';

// In API route
const jobTitles = await jobService.getAllJobTitles('engineer');
const colleges = await jobService.getAllColleges('IIT');
```

#### AuthService (`lib/services/auth.service.js`)

Handles authentication operations (Clerk + cookie-based).

**Methods:**
- `getCurrentUser()` - Get current authenticated user (Clerk or cookie)
- `getUserFromClerk(userId)` - Get/create user from Clerk
- `getUserFromSession(sessionToken)` - Get user from cookie session
- `createSessionToken(userId)` - Generate session token

**Cache Strategy:**
- Delegates to `UserService` for user caching
- No additional caching (auth checks should be fresh)

**Example:**
```javascript
import { authService } from '../../../lib/services/auth.service';

// In API route
const user = await authService.getCurrentUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Cache Strategy

### TTL (Time To Live) Guidelines

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| User profile | 15 min | Changes infrequently, but needs to reflect updates reasonably fast |
| Gigs | 5 min | Dynamic content, needs to be relatively fresh |
| Localities/Pincodes | 1 hour | Static geographic data, rarely changes |

### Cache Invalidation Patterns

1. **Write-Through**: Update database, then invalidate cache
   ```javascript
   const updated = await prisma.user.update({ ... });
   await cacheService.del(`user:id:${id}`);
   ```

2. **Pattern-Based**: Invalidate multiple related keys
   ```javascript
   await cacheService.delPattern('gigs:location:*');
   ```

3. **Specific Keys**: Invalidate exact cache keys
   ```javascript
   await cacheService.del(`gigs:user:${userId}`);
   await cacheService.del(`gigs:location:${state}:${district}:all`);
   ```

## Migration Guide

### How to Refactor an API Route

**Before (Direct Prisma):**
```javascript
// app/api/example/route.js
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const data = await prisma.example.findMany();
  return NextResponse.json({ data });
}
```

**After (Service Layer):**

1. **Create Service** (`lib/services/example.service.js`):
```javascript
import { prisma } from '../prisma';
import { cacheService } from './cache.service';

class ExampleService {
  async getAll() {
    return cacheService.wrap(
      'examples:all',
      300, // 5 min
      () => prisma.example.findMany()
    );
  }
}

export const exampleService = new ExampleService();
```

2. **Update Route** (`app/api/example/route.js`):
```javascript
import { exampleService } from '../../../lib/services/example.service';

export async function GET() {
  const data = await exampleService.getAll();
  return NextResponse.json({ data });
}
```

### Routes Already Migrated

✅ `/api/gigs` → `GigService`
✅ `/api/profile` → `UserService`
✅ `/api/localities` → `LocationService`

### Routes Pending Migration

- `/api/onboarding/*` routes
- `/api/auth/*` routes
- `/api/colleges/route.js`
- `/api/job-titles/route.js`

## Best Practices

### 1. Keep Routes Thin

API routes should only:
- Validate request format
- Check authentication
- Call service methods
- Format responses

**Good:**
```javascript
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const data = await myService.getData(user.id);
  return NextResponse.json({ success: true, data });
}
```

**Bad:**
```javascript
export async function GET(request) {
  // Don't put business logic in routes
  const data = await prisma.example.findMany({
    where: { complex: 'logic' },
    include: { nested: true },
  });
  // Don't do data transformations in routes
  const transformed = data.map(item => ({ ...item, extra: 'field' }));
  return NextResponse.json(transformed);
}
```

### 2. Use Cache Wrapper Pattern

**Preferred:**
```javascript
async getUserData(userId) {
  return cacheService.wrap(
    `user:${userId}`,
    900,
    () => prisma.user.findUnique({ where: { id: userId } })
  );
}
```

**Avoid:**
```javascript
async getUserData(userId) {
  const cached = await cacheService.get(`user:${userId}`);
  if (cached) return cached;
  
  const data = await prisma.user.findUnique({ where: { id: userId } });
  await cacheService.set(`user:${userId}`, data, 900);
  return data;
}
```

### 3. Invalidate Related Caches

When updating data, invalidate all related cache keys:

```javascript
async updateGig(gigId, data) {
  const gig = await prisma.gig.update({ where: { id: gigId }, data });
  
  // Invalidate all related caches
  await cacheService.del(`gig:id:${gigId}`);
  await cacheService.del(`gigs:user:${gig.userId}`);
  await cacheService.delPattern(`gigs:location:*`);
  
  return gig;
}
```

### 4. Handle Cache Failures Gracefully

Services should work even if Redis is unavailable:

```javascript
// CacheService automatically falls back to in-memory cache
// No special handling needed in service methods
```

### 5. Use Consistent Cache Key Naming

Follow this pattern: `{resource}:{identifier}:{value}`

**Examples:**
- `user:id:123`
- `user:email:user@example.com`
- `gigs:user:123`
- `gigs:location:Kerala:Kochi:all`
- `localities:Kerala`

## Monitoring and Debugging

### Check Redis Connection

```javascript
import { redis } from './lib/redis';

if (redis) {
  console.log('✅ Redis connected');
  await redis.ping(); // Should return 'PONG'
} else {
  console.log('⚠️  Redis not available, using memory cache');
}
```

### View Cache Keys (Redis CLI)

```bash
# Connect to Redis
redis-cli

# List all keys
KEYS *

# Get a specific key
GET "user:id:123"

# Delete a key
DEL "user:id:123"

# Delete pattern
KEYS "gigs:*" | xargs redis-cli DEL
```

### Debug Cache Hits/Misses

Add logging to `CacheService.wrap()`:

```javascript
async wrap(key, ttlSeconds, fetchFn) {
  const cached = await this.get(key);
  if (cached !== null) {
    console.log(`🎯 Cache HIT: ${key}`);
    return cached;
  }
  
  console.log(`❌ Cache MISS: ${key}`);
  const value = await fetchFn();
  await this.set(key, value, ttlSeconds);
  return value;
}
```

## Performance Considerations

### Cache Hit Rate

Monitor cache hit rates to ensure caching is effective:
- Target: >80% hit rate for read-heavy endpoints
- If hit rate is low, consider increasing TTL or reviewing cache keys

### Database Query Reduction

Before caching:
- 100 requests = 100 database queries

After caching (5 min TTL):
- 100 requests = ~1-2 database queries (depending on timing)

### Memory Usage

- Redis: Stores serialized JSON, efficient for structured data
- Memory fallback: Limited by Node.js heap, suitable for development only

## Deployment

### Development

Redis is optional. If `REDIS_URL` is not set, the app falls back to in-memory caching:

```bash
# .env.local (Redis optional)
# REDIS_URL not set - memory cache will be used
```

### Production

Redis is recommended for production:

```bash
# .env.production
REDIS_URL=redis://user:password@your-redis-host:6379
```

**Recommended Redis Providers:**
- Upstash (serverless Redis)
- Redis Cloud
- AWS ElastiCache
- Vercel KV (if deploying to Vercel)

### Scaling Considerations

1. **Horizontal Scaling**: Multiple app instances can share the same Redis cache
2. **Cache Warming**: Pre-populate cache with frequently accessed data on startup
3. **Cache Partitioning**: Use different Redis databases for different data types
4. **TTL Tuning**: Adjust TTLs based on actual usage patterns

## Troubleshooting

### Issue: "Redis connection timeout"

**Solution:** Check Redis URL and network connectivity. App will fall back to memory cache.

### Issue: "Cache not invalidating"

**Solution:** Verify cache invalidation logic in service methods. Use `delPattern()` for related keys.

### Issue: "Stale data in cache"

**Solution:** Reduce TTL or implement more aggressive cache invalidation.

### Issue: "High memory usage"

**Solution:** 
- Check Redis memory usage: `redis-cli INFO memory`
- Reduce TTLs for large datasets
- Implement cache eviction policies in Redis

## Future Enhancements

1. **Cache Warming**: Pre-populate cache on app startup
2. **Cache Metrics**: Track hit/miss rates, latency
3. **Cache Versioning**: Invalidate all caches on schema changes
4. **Distributed Caching**: Multi-region Redis setup
5. **Cache Compression**: Compress large cached values
6. **Smart Invalidation**: Use database triggers or event streams

## References

- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Prisma Caching Guide](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Last Updated:** February 2026
**Version:** 1.0
**Author:** NextDoorJobs Development Team
