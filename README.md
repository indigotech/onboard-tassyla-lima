# Backend Onboard - Taki Tássy Sever

## Description

In this project, the main goal is to develop a server application that can perform basic CRUD (Create, Read, Update, Delete) operations on a database. Through hands-on learning and practical exercises, the intention is to get me familiarized with the technology stack, coding patterns, and best practices we use at Tactile.

## Environment and tools

In our project, we use Node.js and npm to handle our packages. We manage our PostgreSQL databases using Docker containers and to make working with databases smoother, we use TypeORM. It lets us describe our databases using TypeScript, which simplifies things. To fetch data efficiently we use GraphQL: it lets us ask for exactly the data we need.

Keeping our code clean is really important too. That's where Eslint and Prettier come in handy. Eslint helps us stick to coding rules and catches mistakes, while Prettier makes sure our code looks consistent and is easy to read.

## Steps to run and debug

Once you have Node.js and Docker installed, you can simply execute these:

1. `docker compose up -d`
1. `npm install`
1. `node start`

If you already ran this project once, you can skip the first step listed up here if your containers are already created and running. Also, if you have all dependencies updated you can skip the second step.
