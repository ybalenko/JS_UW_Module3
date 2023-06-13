const request = require('supertest');
const server = require('../server');
const testUtils = require('../test-utils');
const Subscription = require('../models/subscription');
const subscriptionDAO = require('../daos/subscription');
const subscription = require('../models/subscription');


describe('Subscription routes', () => {
    beforeAll(testUtils.connectDB);
    afterAll(testUtils.stopDB);
    afterEach(testUtils.clearDB);


    const activeSubscription = { name: 'Active', durationDays: 10, startDate: '2023-06-12' };
    const inactiveSubscription = { name: 'Inactive', durationDays: 15, startDate: '2020-06-12' };
    const subscriptionForUpdate = { name: 'For update', durationDays: 10, startDate: '2023-06-12' };
    const subscriptionForDelete = { name: 'For delete', durationDays: 30, startDate: '2020-06-12' };

    const userUser = {
        email: 'userUser@test.com',
        password: 'pwd1234',
        role: 'user'
    };
    const userAdmin = {
        email: 'userAdmin@test.com',
        password: 'pwd5678',
        role: 'admin'
    }

    let userToken;
    let tokenAdmin;
    let userId;
    let activeSubscriptionObj;
    let inactiveSubscriptionObj;
    let subscriptionForUpdateObj;
    let subscriptionForDeleteObj;

    beforeEach(async () => {
        const signupRes = await request(server).post('/login/signup').send(userUser);
        userId = signupRes.body.userId;
        const loginRes = await request(server).post('/login').send(userUser);
        userToken = loginRes.body.token;

        const adminSignupRes = await request(server).post('/login/signup').send(userAdmin);
        adminId = adminSignupRes.body.adminId;
        const adminLoginRes = await request(server).post('/login').send(userAdmin);
        tokenAdmin = adminLoginRes.body.token;

        activeSubscriptionObj = {
            ...activeSubscription,
            userId: userId
        }
        await Subscription.create(activeSubscriptionObj);

        inactiveSubscriptionObj = {
            ...inactiveSubscription,
            userId: userId
        }
        await Subscription.create(inactiveSubscriptionObj);

        subscriptionForUpdateObj = {
            ...subscriptionForUpdate,
            userId: userId
        }
        await Subscription.create(subscriptionForUpdateObj);

        subscriptionForDeleteObj = {
            ...subscriptionForDelete,
            userId: userId
        }
        await Subscription.create(subscriptionForDeleteObj);
    });


    describe('Anonymous user', () => {
        describe('GET /subscription', () => {
            it('should return 401 for anonymous user', async () => {
                const result = await request(server).get('/subscription');
                expect(result.statusCode).toEqual(401);
            });
        });

        describe('POST /subscription', () => {
            it('should return 401 for anonymous user', async () => {
                const newSubscription = { durationDays: 10, name: 'test name', startDate: '2023-06-12' };
                const res = await request(server)
                    .post('/subscription')
                    .send(newSubscription);
                expect(res.statusCode).toEqual(401);
            });
        });

        describe('PUT /subscription/:id', () => {
            it('should return 401 for anonymous user', async () => {
                const subscription = await subscriptionDAO.getByName('For update');
                const newSubscription = { durationDays: 15, name: 'test name', startDate: '2023-06-12' };
                const res = await request(server)
                    .put('/subscription/' + subscription._id)
                    .send(newSubscription);
                expect(res.statusCode).toEqual(401);
            });
        });

        describe('DELETE /subscription/:id', () => {
            it('should return 401 for anonymous user', async () => {
                const subscription = await subscriptionDAO.getByName('For delete');
                const res = await request(server).delete('/subscription/' + subscription._id);
                expect(res.statusCode).toEqual(401);
            });
        });
    });

    describe('Registered user', () => {
        describe('GET /subscription', () => {
            it('should return 200 for a registered user', async () => {
                const subscriptions = [activeSubscription, inactiveSubscription, subscriptionForUpdate, subscriptionForDelete];
                const res = await request(server)
                    .get('/subscription')
                    .set('Authorization', 'Bearer ' + userToken)
                    .send();
                expect(res.statusCode).toEqual(200);
                expect(res.body).toMatchObject(subscriptions);
            });
        });

        describe('POST /subscription', () => {
            it('should return 200 for registered user', async () => {
                const newSubscription = { durationDays: 10, name: 'test name', startDate: '2000-12-09T00:00:00.000Z' };
                const res = await request(server)
                    .post('/subscription')
                    .set('Authorization', 'Bearer ' + userToken)
                    .send(newSubscription);
                expect(res.statusCode).toEqual(200);
                expect(res.body).toMatchObject(newSubscription);
            });
        });
        describe('PUT /subscription/:id', () => {
            it('should return 200 for registered user', async () => {
                const subscription = await subscriptionDAO.getByName('For update');
                const newSubscription = { durationDays: 15, name: 'test name', startDate: '2023-06-12T05:50:25.543Z' };
                const res = await request(server)
                    .put('/subscription/' + subscription._id)
                    .set('Authorization', 'Bearer ' + userToken)
                    .send(newSubscription);
                expect(res.statusCode).toEqual(200);
                const updatedSubscription = await subscriptionDAO.getById(subscription._id);
                const updatedSubscriptionObj = {
                    durationDays: updatedSubscription.durationDays,
                    name: updatedSubscription.name,
                    startDate: updatedSubscription.startDate.toISOString()
                }
                expect(updatedSubscriptionObj).toMatchObject(newSubscription);
            });
        });
        describe('DELETE /subscription/:id', () => {
            it('should return 200 for registered user', async () => {
                const subscription = await subscriptionDAO.getByName('For delete');
                const res = await request(server)
                    .delete('/subscription/' + subscription._id)
                    .set('Authorization', 'Bearer ' + userToken)
                    .send();
                const deletedSubscription = await subscriptionDAO.getById(subscription._id);
                expect(res.statusCode).toEqual(200);
                expect(deletedSubscription).toBe(null);
            });
        });
    });

    describe('Admin', () => {
        describe('GET /subscription', () => {
            it('should return 200 for admin', async () => {
                const subscriptions = [activeSubscription, inactiveSubscription, subscriptionForUpdate, subscriptionForDelete];
                const res = await request(server)
                    .get('/subscription')
                    .set('Authorization', 'Bearer ' + tokenAdmin)
                    .send();
                expect(res.statusCode).toEqual(200);
                expect(res.body).toMatchObject(subscriptions);
            });
        });

        describe('POST /subscription', () => {
            it('should return 200 for admin', async () => {
                const newSubscription = { durationDays: 10, name: 'test name', startDate: '2000-12-09T00:00:00.000Z' };
                const res = await request(server)
                    .post('/subscription')
                    .set('Authorization', 'Bearer ' + tokenAdmin)
                    .send(newSubscription);
                expect(res.statusCode).toEqual(200);
                expect(res.body).toMatchObject(newSubscription);
            });
        });
        describe('PUT /subscription/:id', () => {
            it('should return 200 for admin', async () => {
                const subscription = await subscriptionDAO.getByName('For update');
                const newSubscription = { durationDays: 15, name: 'test name', startDate: '2023-06-12T05:50:25.543Z' };
                const res = await request(server)
                    .put('/subscription/' + subscription._id)
                    .set('Authorization', 'Bearer ' + tokenAdmin)
                    .send(newSubscription);
                expect(res.statusCode).toEqual(200);
                const updatedSubscription = await subscriptionDAO.getById(subscription._id);
                const updatedSubscriptionObj = {
                    durationDays: updatedSubscription.durationDays,
                    name: updatedSubscription.name,
                    startDate: updatedSubscription.startDate.toISOString()
                }
                expect(updatedSubscriptionObj).toMatchObject(newSubscription);
            });
        });
        describe('DELETE /subscription/:id', () => {
            it('should return 200 for admin', async () => {
                const subscription = await subscriptionDAO.getByName('For delete');
                const res = await request(server)
                    .delete('/subscription/' + subscription._id)
                    .set('Authorization', 'Bearer ' + tokenAdmin)
                    .send();
                const deletedSubscription = await subscriptionDAO.getById(subscription._id);
                expect(res.statusCode).toEqual(200);
                expect(deletedSubscription).toBe(null);
            });
        });
    });
});
