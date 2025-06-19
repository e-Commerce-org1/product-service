<p align="center">
  <a href="http://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<p align="center">A microservice for managing products in an e-commerce application, built with <a href="http://nestjs.com" target="_blank">NestJS</a> and using <a href="https://grpc.io/" target="_blank">gRPC</a> for inter-service communication.</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
  <a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
  <a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
</p>

---

## 📦 Description

This is the **Product Service** of an e-commerce backend, responsible for managing all product-related data such as products, categories, sizes, inventory, and product reviews.

- Built using [NestJS](https://nestjs.com)
- Communicates with other services using [gRPC](https://grpc.io)
- Connects to MongoDB using Mongoose
- Admin-related operations (CRUD) are handled over gRPC by an Admin Service
- Frontend-accessible REST APIs include:
  - **Product listing with filters**
  - **Product detail with similar products**
  - **Submit product review** (only allowed when the order is marked as delivered on the frontend)

---

## 🔧 Environment Variables

Below is a sample `.env` file required for running the service:

```env
HTTP_PORT=3000
GRPC_SERVER_URL=0.0.0.0:5001
MONGODB_URI=your mongo uri
MONGODB_NAME=your database name
```

---

## 🚀 Project Setup

```bash
$ npm install
```

### Run the application

```bash
# Development mode
$ npm run start

# Watch mode (auto-restart)
$ npm run start:dev

# Production mode
$ npm run start:prod
```

---

## 🧪 Testing

```bash
# Unit tests
$ npm run test

# End-to-end tests
$ npm run test:e2e

# Test coverage
$ npm run test:cov
```

---

## 📡 API Endpoints

### 🟢 Public REST APIs (For Frontend)

- **GET /products/all** – Fetch paginated, filtered product list and apply filter with the query parameters
- **GET /products/:id** – Fetch product details with similar products
- **POST /products/:id/review** – Submit a product review (only from frontend after delivery)

### 🔒 Admin gRPC APIs

Handled via Admin Service using gRPC, including:

- Create Product
- Update Product
- Delete Product
- Get Product
- Get Product listing
- Manage Inventory
- Manage Inventory By Order

---

## 📁 Folder Structure (Overview)

```
src/
├── main.ts
├── app.module.ts
├── constants/
│   ├── app.constant.ts
│   ├── grpc.contant.ts
│   ├── helper.function.ts
│   └── response.helper.ts 
├── database/
│   └── database.module.ts
├── filters/
│   ├── responses/
│   ├── AppException.ts
│   ├── GrpcAppException.ts
│   └── http-exception.filter.ts
├── interfaces/
│   └── helper.interface.ts
├── logger/
│   └── winston.logger.ts
├── product/
│   ├── dao/
│   |   └── ...
│   ├── dtos/
│   |   └── ...
│   ├── schema/
│   |   └── ...
│   ├── product.grpc.controller.ts
│   ├── product.controller.ts
│   ├── product.module.ts
│   └── product.service.ts
├── proto/
│   └── product.proto
├── review/
│   └── ...
```

---

## 🛠 Deployment

You can deploy this service using any cloud platform that supports Node.js. For AWS-based deployment, you may consider using [NestJS Mau](https://mau.nestjs.com):

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

---

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [gRPC Docs](https://grpc.io/docs/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [NestJS gRPC Microservices](https://docs.nestjs.com/microservices/basics)
- [NestJS Devtools](https://devtools.nestjs.com)

---

## 🧑‍💻 Author

- Author – Piyush Gupta

---

## 📝 License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).