# 漾立方健身房管理系统

基于 NestJS + Prisma + MySQL + JWT 的后端，以及 Next.js + Ant Design 的管理后台。当前版本是可运行、可迭代的 MVP 骨架，优先跑通会员、开卡、私教预约、门禁 mock、实时人数和权限控制。

## 1. 项目初始化目录

```text
.
├── apps
│   ├── api                 # NestJS 后端
│   │   ├── prisma          # Prisma schema 与 seed
│   │   ├── src             # 业务模块
│   │   └── test            # 基础单元测试
│   └── web                 # Next.js 管理后台
│       ├── app             # App Router 页面
│       ├── components      # 后台布局与表格组件
│       └── lib             # API 客户端
├── docker-compose.yml      # MySQL 8.4
├── package.json            # npm workspaces
└── .env.example
```

## 2. 首批文件清单

首批核心文件已经创建：

- 根目录：`package.json`、`package-lock.json`、`.env.example`、`docker-compose.yml`
- 后端配置：`apps/api/package.json`、`tsconfig.json`、`nest-cli.json`、`jest.config.ts`
- 数据库：`apps/api/prisma/schema.prisma`、`apps/api/prisma/seed.ts`
- 后端入口：`apps/api/src/main.ts`、`apps/api/src/app.module.ts`
- 后端公共层：`common/enums.ts`、`business-error.ts`、`error-codes.ts`、`guards/*`、`decorators/*`
- 后端模块：`auth`、`members`、`trainers`、`packages`、`member-cards`、`appointments`、`access`、`presence`、`payments`、`dashboard`
- 前端配置：`apps/web/package.json`、`next.config.ts`、`tsconfig.json`
- 前端页面：登录、工作台、会员列表、会员详情、教练、套餐、开卡、预约、门禁记录、实时人数

## 3. 数据库 schema

数据库 schema 位于 `apps/api/prisma/schema.prisma`，使用 MySQL provider。已实现规格书 9 张核心表：

- `admins`
- `members`
- `trainers`
- `packages`
- `member_cards`
- `appointments`
- `access_logs`
- `payments`
- `member_presence`

换卡通过 `member_cards.source_card_id` 保留历史链路；支付与开卡、续卡、换卡、加次/加课时关联，保留收银流水。

## 4. 核心枚举与常量

后端业务枚举位于 `apps/api/src/common/enums.ts`，Prisma 枚举位于 schema：

- 会员状态：`ACTIVE`、`FROZEN`、`EXPIRED`、`BLACKLISTED`
- 套餐类型：`TIME_CARD`、`VISIT_CARD`、`PT_CARD`
- 会员卡状态：`ACTIVE`、`EXPIRED`、`FROZEN`、`TRANSFERRED`
- 课程状态：`BOOKED`、`CANCELLED`、`COMPLETED`、`ABSENT`
- 通行方向：`IN`、`OUT`
- 通行结果：`ALLOWED`、`DENIED`、`ERROR`、`MANUAL`
- 角色类型：`SUPER_ADMIN`、`FRONT_DESK`、`TRAINER`

## 5. 后端模块代码骨架

已创建并接入 `AppModule`：

- `AuthModule`：登录、JWT 签发
- `MembersModule`：会员 CRUD、搜索、详情聚合
- `TrainersModule`：教练 CRUD、启停
- `PackagesModule`：套餐 CRUD、类型规则校验、启停
- `MemberCardsModule`：开卡、续卡、换卡、加次/加课时、预警
- `AppointmentsModule`：预约创建、修改、取消、完成、缺席
- `AccessModule`：门禁 mock 校验与日志
- `PresenceModule`：实时人数统计、在馆列表、管理员纠偏
- `PaymentsModule`：支付记录查询
- `DashboardModule`：工作台聚合数据

已覆盖的业务点：后端模块边界与规格书一致，公共鉴权、角色权限、异常格式、参数校验已统一接入。

## 6. 前端页面骨架

页面位于 `apps/web/app`：

- `/login` 登录页
- `/dashboard` 工作台
- `/members` 会员列表页
- `/members/[id]` 会员详情页
- `/trainers` 教练页
- `/packages` 套餐页
- `/cards/open` 开卡页
- `/appointments` 预约页
- `/access-logs` 门禁记录页
- `/presence` 实时人数看板

已覆盖的业务点：页面不只是静态占位，已绑定后端接口、JWT token、列表加载、基础新增表单、预约动作和人数纠偏表单。

## 7. 关键 service 实现

重点业务逻辑已落地：

- 开卡：`MemberCardsService.openCard`
- 续卡：`MemberCardsService.renewCard`
- 换卡：`MemberCardsService.changeCard`
- 加次/加课时：`MemberCardsService.addBalance`
- 预约冲突校验：`AppointmentsService.assertBookable`
- 私教完成消课：`AppointmentsService.complete`
- 门禁校验：`AccessService.verify`
- 实时人数更新：`AccessService.verify` + `PresenceService.summary`
- 管理员纠偏：`PresenceService.correct`

已覆盖的业务点：涉及扣减次数、课程状态切换、人数增减、支付流水写入的逻辑均放入 Prisma transaction；次数扣减使用 `updateMany` 加余额条件，保留最基本并发防护。

## 8. 关键 controller / route 实现

主要 API：

- `POST /api/auth/login`
- `GET|POST /api/members`、`GET|PATCH /api/members/:id`
- `GET|POST|PATCH /api/trainers`
- `GET|POST|PATCH /api/packages`
- `POST /api/member-cards/open`
- `POST /api/member-cards/renew`
- `POST /api/member-cards/change`
- `POST /api/member-cards/add-balance`
- `GET /api/member-cards/warnings`
- `GET|POST /api/appointments`
- `PATCH /api/appointments/:id`
- `POST /api/appointments/:id/cancel`
- `POST /api/appointments/:id/complete`
- `POST /api/appointments/:id/absent`
- `POST /api/access/verify`
- `GET /api/access/logs`
- `GET /api/presence/summary`
- `GET /api/presence/current-members`
- `POST /api/presence/corrections`
- `GET /api/payments`
- `GET /api/dashboard`

已覆盖的业务点：认证、会员、教练、套餐、会员卡、预约、门禁、实时人数、支付、工作台均已有可调用接口。

## 9. 权限中间件 / guard

权限文件：

- JWT Guard：`apps/api/src/common/guards/jwt-auth.guard.ts`
- Roles Guard：`apps/api/src/common/guards/roles.guard.ts`
- 角色装饰器：`apps/api/src/common/decorators/roles.decorator.ts`

权限策略：

- `SUPER_ADMIN`：所有后台操作
- `FRONT_DESK`：会员、开卡收银、预约、门禁、纠偏等前台业务
- `TRAINER`：可查看并处理私教预约

已覆盖的业务点：写操作已限制角色；读操作默认要求登录；超级管理员自动拥有所有角色权限。

## 10. 基础测试

测试位于 `apps/api/test`：

- 预约冲突测试：`appointments.service.spec.ts`
- 次数不足测试：`appointments.service.spec.ts`
- 重复入场测试：`access.service.spec.ts`
- 异常离场测试：`access.service.spec.ts`
- 开卡成功测试：`member-cards.service.spec.ts`

已覆盖的业务点：优先覆盖最容易产生资金/次数/人数错误的边界。

## 11. 启动说明

1. 安装依赖：

```bash
npm install
```

2. 创建环境变量文件：

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

Windows PowerShell 可手动复制上述两个 example 文件。

3. 启动 MySQL：

```bash
docker compose up -d mysql
```

4. 生成 Prisma Client：

```bash
npm run prisma:generate
```

5. 迁移数据库：

```bash
npm run prisma:migrate
```

6. 写入默认管理员与示例套餐：

```bash
npm run prisma:seed
```

默认账号：

```text
username: admin
password: admin123
```

7. 启动后端：

```bash
npm run dev:api
```

后端地址：`http://localhost:3001/api`

8. 启动前端：

```bash
npm run dev:web
```

前端地址：`http://localhost:3000`

### 安全注意事项

- 生产环境必须设置 JWT_SECRET（长度 ≥ 48 字符）
- 生产环境必须修改 docker-compose.yml 中的 MySQL root 密码
- 首次部署后立即修改默认管理员密码 admin123
- WEB_ORIGIN 必须设置为实际前端域名

## 已验证

- `npm --workspace apps/api run prisma:generate`
- 临时注入 `DATABASE_URL` 后执行 `npx prisma validate`
- `npm --workspace apps/api run test`
- `npm --workspace apps/api run build`
- `npm --workspace apps/web run build`
