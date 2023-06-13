
const request = require("supertest");
var jwt = require('jsonwebtoken');
const server = require("../server");
const testUtils = require('../test-utils');
const User = require('../models/user');

describe("/login", () => {
    beforeAll(testUtils.connectDB);
    afterAll(testUtils.stopDB);
    afterEach(testUtils.clearDB);

    const user0 = {
        email: 'user0@test.com',
        password: '123456'
    };
    const user1 = {
        email: 'user1@test.com',
        password: '789101'
    }

    describe("Anonymous user", () => {
        describe("POST /", () => {
            it("should return 401 for anonymous user", async () => {
                const res = await request(server).post("/login").send(user0);
                expect(res.statusCode).toEqual(401);
            });
        });

        describe("POST /password", () => {
            it("should return 401 for anonymous user", async () => {
                const res = await request(server).post("/login/password").send(user0);
                expect(res.statusCode).toEqual(401);
            });
        });

        describe("POST /logout", () => {
            it("should return 401 for anonymous user", async () => {
                const res = await request(server).post("/login/logout").send();
                expect(res.statusCode).toEqual(401);
            });
        });
    });


    describe("Signup test cases ", () => {
        describe("POST /signup", () => {
            it("should return 400 without a password", async () => {
                const res = await request(server).post("/login/signup").send({
                    email: user0.email,
                });
                expect(res.statusCode).toEqual(400);
            });


            it("should return 400 with empty password", async () => {
                const res = await request(server).post("/login/signup").send({
                    email: user1.email,
                    password: ""
                });
                expect(res.statusCode).toEqual(400);
            });


            it("should return 200 with a valid password", async () => {
                const res = await request(server).post("/login/signup").send(user1);
                expect(res.statusCode).toEqual(200);
            });

            it("should return 409 conflict with a repeat signup", async () => {
                let res = await request(server).post("/login/signup").send(user0);
                expect(res.statusCode).toEqual(200);
                res = await request(server).post("/login/signup").send(user0);
                expect(res.statusCode).toEqual(409);
            });
            it("should not store raw password", async () => {
                await request(server).post("/login/signup").send(user0);
                const users = await User.find().lean();
                users.forEach((user) => {
                    expect(Object.values(user).includes(user0.password)).toBe(false);
                });
            });
            it("should return 401 when password doesn't match", async () => {
                const res = await request(server).post("/login").send({
                    email: user0.email,
                    password: '123'
                });
                expect(res.statusCode).toEqual(401);
            });
        });
    });

    describe("After both users logged in", () => {
        let token0;
        let token1;
        beforeEach(async () => {
            await request(server).post("/login/signup").send(user0);
            const res0 = await request(server).post("/login").send(user0);
            token0 = res0.body.token;

            await request(server).post("/login/signup").send(user1);
            const res1 = await request(server).post("/login").send(user1);
            token1 = res1.body.token;
        });

        describe("POST /password", () => {
            it("should reject bogus token", async () => {
                const res = await request(server)
                    .post("/login/password")
                    .set('Authorization', 'Bearer BAD')
                    .send({ password: '123' });
                expect(res.statusCode).toEqual(401);
            });
            it("should reject empty password", async () => {
                const res = await request(server)
                    .post("/login/password")
                    .set('Authorization', 'Bearer ' + token0)
                    .send({ password: '' });
                expect(res.statusCode).toEqual(400);
            });
            it("should change password for user0", async () => {
                const res = await request(server)
                    .post("/login/password")
                    .set('Authorization', 'Bearer ' + token0)
                    .send({ password: '123' });
                console.log('login tests: user 0 token', token0) //

                expect(res.statusCode).toEqual(200);
                let loginRes0 = await request(server).post("/login").send(user0);
                expect(loginRes0.statusCode).toEqual(401);
                loginRes0 = await request(server).post("/login").send({
                    email: user0.email,
                    password: '123'
                });
                expect(loginRes0.statusCode).toEqual(200);
                const loginRes1 = await request(server).post("/login").send(user1);
                expect(loginRes1.statusCode).toEqual(200);
            });
            it("should change password for user1", async () => {
                const res = await request(server)
                    .post("/login/password")
                    .set('Authorization', 'Bearer ' + token1)
                    .send({ password: '123' });
                console.log('login tests: user 1 token', token1) //

                expect(res.statusCode).toEqual(200);
                const loginRes0 = await request(server).post("/login").send(user0);
                expect(loginRes0.statusCode).toEqual(200);
                let loginRes1 = await request(server).post("/login").send(user1);
                expect(loginRes1.statusCode).toEqual(401);
                loginRes1 = await request(server).post("/login").send({
                    email: user1.email,
                    password: '123'
                });
                expect(loginRes1.statusCode).toEqual(200);
            });

        });
    });
});