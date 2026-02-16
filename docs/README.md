# NextDoorJobs Documentation

Welcome to the NextDoorJobs technical documentation.

## 📚 Documentation Index

### Service Layer Architecture

The application uses a service layer architecture with Redis caching for improved performance and scalability.

| Document | Description | Audience |
|----------|-------------|----------|
| **[Service Layer Quick Start](./SERVICE_LAYER_QUICK_START.md)** | Quick reference for developers | All developers |
| **[Service Layer Documentation](./SERVICE_LAYER.md)** | Complete architecture guide | Senior developers, architects |
| **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** | What was built and why | Project managers, tech leads |

### Getting Started

1. **New to the project?** Start with [Service Layer Quick Start](./SERVICE_LAYER_QUICK_START.md)
2. **Building a new feature?** Follow the patterns in [Service Layer Quick Start](./SERVICE_LAYER_QUICK_START.md)
3. **Understanding architecture?** Read [Service Layer Documentation](./SERVICE_LAYER.md)
4. **Reviewing implementation?** Check [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

## 🏗️ Architecture Overview

```
Frontend (React/Next.js)
    ↓
API Routes (Thin Controllers)
    ↓
Service Layer (Business Logic + Caching)
    ↓
Data Layer (Prisma + Redis + PostgreSQL)
```

## 🚀 Key Features

- **Service Layer**: Clean separation of concerns
- **Redis Caching**: Reduced database load, faster responses
- **Graceful Fallback**: Works without Redis (development mode)
- **Horizontal Scaling**: Ready for multiple instances
- **Comprehensive Docs**: Everything you need to know

## 📖 Quick Links

### For Developers
- [How to use services](./SERVICE_LAYER_QUICK_START.md#common-patterns)
- [How to create a new service](./SERVICE_LAYER_QUICK_START.md#creating-a-new-service)
- [Cache strategy](./SERVICE_LAYER_QUICK_START.md#cache-ttl-guidelines)
- [Common mistakes](./SERVICE_LAYER_QUICK_START.md#common-mistakes-to-avoid)

### For Architects
- [Architecture diagram](./SERVICE_LAYER.md#architecture-diagram)
- [Cache strategy](./SERVICE_LAYER.md#cache-strategy)
- [Performance considerations](./SERVICE_LAYER.md#performance-considerations)
- [Scaling considerations](./SERVICE_LAYER.md#scaling-considerations)

### For DevOps
- [Deployment checklist](./IMPLEMENTATION_SUMMARY.md#deployment-checklist)
- [Environment setup](./SERVICE_LAYER_QUICK_START.md#environment-setup)
- [Monitoring](./SERVICE_LAYER.md#monitoring-and-debugging)
- [Troubleshooting](./SERVICE_LAYER.md#troubleshooting)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (ioredis)
- **Authentication**: Clerk
- **Deployment**: Vercel (recommended)

## 📦 Project Structure

```
NextDoorJobs/
├── app/
│   ├── api/                    # API routes (thin controllers)
│   │   ├── gigs/              # Uses GigService
│   │   ├── profile/           # Uses UserService
│   │   └── localities/        # Uses LocationService
│   └── components/            # React components
├── lib/
│   ├── services/              # Service layer (NEW)
│   │   ├── cache.service.js   # Caching abstraction
│   │   ├── gig.service.js     # Gig business logic
│   │   ├── user.service.js    # User business logic
│   │   └── location.service.js # Location business logic
│   ├── redis.js               # Redis client
│   └── prisma.js              # Prisma client
├── docs/                      # Documentation (you are here)
└── prisma/
    └── schema.prisma          # Database schema
```

## 🎯 Current Status

### ✅ Completed
- Service layer architecture implemented
- Redis caching integrated
- 3 core services created (Gig, User, Location)
- 3 API routes refactored
- Comprehensive documentation

### 🔄 In Progress
- Monitoring and metrics setup
- Cache hit rate optimization

### 📋 Planned
- Migrate remaining API routes
- Add cache warming
- Implement cache metrics dashboard
- Database query optimization

## 🤝 Contributing

### Adding a New Service

1. Create service file in `lib/services/`
2. Follow the pattern in existing services
3. Use cache wrapper pattern for reads
4. Implement cache invalidation for writes
5. Update API route to use service
6. Test thoroughly

See [Creating a New Service](./SERVICE_LAYER_QUICK_START.md#creating-a-new-service) for detailed steps.

### Code Style

- Use consistent cache key naming: `{resource}:{identifier}:{value}`
- Keep API routes thin (< 100 lines)
- Put business logic in services
- Always invalidate cache on writes
- Add JSDoc comments for public methods

## 📊 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Cache hit rate | >80% | TBD (monitoring needed) |
| API response time (cached) | <50ms | TBD |
| API response time (uncached) | <500ms | TBD |
| Database query reduction | 10x | TBD |

## 🐛 Troubleshooting

### Common Issues

1. **Redis connection errors**
   - Check `REDIS_URL` environment variable
   - App will fall back to memory cache

2. **Stale cache data**
   - Verify cache invalidation in service methods
   - Check TTL values

3. **High memory usage**
   - Monitor Redis memory: `redis-cli INFO memory`
   - Adjust TTLs or implement eviction policies

See [Troubleshooting Guide](./SERVICE_LAYER.md#troubleshooting) for more details.

## 📞 Support

- **Technical Questions**: Check documentation first
- **Bug Reports**: Create an issue with reproduction steps
- **Feature Requests**: Discuss with team before implementing

## 📝 License

[Your License Here]

---

**Documentation Version:** 1.0
**Last Updated:** February 2026
**Maintained By:** NextDoorJobs Development Team
