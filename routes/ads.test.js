const request = require('supertest');
const server = require('../server');
const testUtils = require('../test-utils');
const Ads = require('../models/ads');
const adsDAO = require('../daos/ads');
const User = require('../models/user');


describe('Ads routes tests', () => {
    beforeAll(testUtils.connectDB);
    afterAll(testUtils.stopDB);
    afterEach(testUtils.clearDB);

    const activeAds = { expirationDate: '2052-12-09', text: 'Test text for active ads', details: 'Test details for active ads' };
    const inactiveAds = { expirationDate: '2000-12-09', text: 'Test text for inactive ads', details: 'Test details for inactive ads' };
    const adsForUpdate = { expirationDate: '2060-12-09', text: 'For update', details: 'Test details' };
    const adsForDelete = { expirationDate: '2060-12-09', text: 'For delete', details: 'Test details' };

    const userUser = {
        email: 'userUser@test.com',
        password: 'pwd1234'
    };

    const userUser2 = {
        email: 'userUser2@test.com',
        password: 'pwd6789'
    };

    const userAdmin = {
        email: 'userAdmin@test.com',
        password: 'pwd5678'
    }

    let userToken;
    let adminToken;
    let user2Token;
    let userId;
    let activeAdsObj;
    let inactiveAdsObj;
    let adsForUpdateObj;
    let adsForDeleteObj;


    beforeEach(async () => {
        //user 1
        const userSignupRes = await request(server).post('/login/signup').send(userUser);
        userId = userSignupRes.body.userId;
        const userLoginRes = await request(server).post('/login').send(userUser);
        userToken = userLoginRes.body.token;

        //user 2
        await request(server).post('/login/signup').send(userUser2);
        const user2LoginRes = await request(server).post('/login').send(userUser2);
        user2Token = user2LoginRes.body.token;

        // admin user
        await request(server).post('/login/signup').send(userAdmin);
        await User.updateOne({ email: userAdmin.email }, { $push: { roles: 'admin' } });
        const adminLoginRes = await request(server).post('/login').send(userAdmin);
        adminToken = adminLoginRes.body.token;

        activeAdsObj = {
            ...activeAds,
            userId: userId
        }
        await Ads.create(activeAdsObj);

        inactiveAdsObj = {
            ...inactiveAds,
            userId: userId
        }
        await Ads.create(inactiveAdsObj);

        adsForUpdateObj = {
            ...adsForUpdate,
            userId: userId
        }
        await Ads.create(adsForUpdateObj);

        adsForDeleteObj = {
            ...adsForDelete,
            userId: userId
        }
        await Ads.create(adsForDeleteObj);

    });


    describe('Anonymous user', () => {
        describe('GET /ads', () => {
            it('should return 200 and all active ads', async () => {
                const ads = [activeAds, adsForUpdate, adsForDelete]
                const result = await request(server).get('/ads');
                expect(result.statusCode).toEqual(200);
                expect(result.body).toMatchObject(ads);
            });
        });

        describe('POST /ads', () => {
            it('should return 401 for anonymous user', async () => {
                const newAds = { expirationDate: '2052-12-09', text: 'Test text for active ads', details: 'Test details for active ads' };
                const res = await request(server)
                    .post('/ads')
                    .send(newAds);
                expect(res.statusCode).toEqual(401);
            });
        });

        describe('PUT /ads/:id', () => {
            it('should return 401 for anonymous user', async () => {
                const ads = await adsDAO.getByText('For update');
                const newAds = { expirationDate: '2052-12-09', text: 'For update', details: 'Updated text' };
                const res = await request(server)
                    .put('/ads/' + ads._id)
                    .send(newAds);
                expect(res.statusCode).toEqual(401);
            });
        });

        describe('DELETE /ads/:id', () => {
            it('should return 401 for anonymous user', async () => {
                const ads = await adsDAO.getByText('For delete');
                const res = await request(server).delete('/ads/' + ads._id);
                expect(res.statusCode).toEqual(401);
            });
        });
    });

    describe('Registered user', () => {
        describe('GET /ads', () => {
            it('should return 200 and all active ads', async () => {
                const ads = [activeAds, adsForUpdate, adsForDelete];
                const res = await request(server).get('/ads');
                expect(res.statusCode).toEqual(200);
                expect(res.body).toMatchObject(ads);
            });
        });
        describe('POST /ads', () => {
            it('should return 200 for registered user', async () => {
                const newAds = { expirationDate: '2030-12-09T00:00:00.000Z', text: 'Test text for active ads', details: 'Test details for active ads' };
                const res = await request(server)
                    .post('/ads')
                    .set('Authorization', 'Bearer ' + userToken)
                    .send(newAds);
                expect(res.statusCode).toEqual(200);
                expect(res.body).toMatchObject(newAds);
            });
        });
        describe('PUT /ads/:id', () => {
            it('should return 200 when updating own ads', async () => {
                const ads = await adsDAO.getByText('For update');
                const newAds = { expirationDate: '2052-12-09T00:00:00.000Z', text: 'For update', details: 'Updated text' };
                const res = await request(server)
                    .put('/ads/' + ads._id)
                    .set('Authorization', 'Bearer ' + userToken)
                    .send(newAds);
                expect(res.statusCode).toEqual(200);
                const updatedAds = await adsDAO.getById(ads._id);
                const actualAds = {
                    expirationDate: updatedAds.expirationDate.toISOString(),
                    text: updatedAds.text,
                    details: updatedAds.details
                }
                expect(actualAds).toMatchObject(newAds);
            });
        });

        describe('PUT /ads/:id', () => {
            it('should return 401 when updating other user ads', async () => {
                const ads = await adsDAO.getByText('For update');
                const newAds = { expirationDate: '2052-12-09T00:00:00.000Z', text: 'For update', details: 'Updated text' };
                const res = await request(server)
                    .put('/ads/' + ads._id)
                    .set('Authorization', 'Bearer ' + user2Token)
                    .send(newAds);
                expect(res.statusCode).toEqual(401);
            });
        });

        describe('DELETE /ads/:id', () => {
            it('should return 200 when deleting own ads', async () => {
                const ads = await adsDAO.getByText('For delete');
                const res = await request(server)
                    .delete('/ads/' + ads._id)
                    .set('Authorization', 'Bearer ' + userToken)
                    .send();
                const deletedAds = await adsDAO.getById(ads._id);
                expect(res.statusCode).toEqual(200);
                expect(deletedAds).toBe(null);

            });
        });

        describe('DELETE /ads/:id', () => {
            it('should return 401 when deleting other user ads', async () => {
                const ads = await adsDAO.getByText('For delete');
                const res = await request(server)
                    .put('/ads/' + ads._id)
                    .set('Authorization', 'Bearer ' + user2Token)
                    .send();
                expect(res.statusCode).toEqual(401);
            });
        });
    });

    describe('Admin', () => {
        describe('GET /ads', () => {
            it('should return 200 and all active ads', async () => {
                const ads = [activeAds, adsForUpdate, adsForDelete];
                const res = await request(server).get('/ads');
                expect(res.statusCode).toEqual(200);
                expect(res.body).toMatchObject(ads);
            });
        });
        describe('POST /ads', () => {
            it('should return 200 for admin', async () => {
                const newAds = { expirationDate: '2030-12-09T00:00:00.000Z', text: 'Test text for active ads', details: 'Test details for active ads' };
                const res = await request(server)
                    .post('/ads')
                    .set('Authorization', 'Bearer ' + adminToken)
                    .send(newAds);
                expect(res.statusCode).toEqual(200);
                expect(res.body).toMatchObject(newAds);
            });
        });
        describe('PUT /ads/:id', () => {
            it('should return 200 when updating any ads', async () => {
                const ads = await adsDAO.getByText('For update');
                const newAds = { expirationDate: '2052-12-09T00:00:00.000Z', text: 'For update', details: 'Updated text' };
                const res = await request(server)
                    .put('/ads/' + ads._id)
                    .set('Authorization', 'Bearer ' + adminToken)
                    .send(newAds);
                expect(res.statusCode).toEqual(200);
                const updatedAds = await adsDAO.getById(ads._id);
                const actualAds = {
                    expirationDate: updatedAds.expirationDate.toISOString(),
                    text: updatedAds.text,
                    details: updatedAds.details
                }
                expect(actualAds).toMatchObject(newAds);
            });
        });
        describe('DELETE /ads/:id', () => {
            it('should return 200 when deleting any ads', async () => {
                const ads = await adsDAO.getByText('For delete');
                const res = await request(server)
                    .delete('/ads/' + ads._id)
                    .set('Authorization', 'Bearer ' + adminToken)
                    .send();
                const deletedAds = await adsDAO.getById(ads._id);
                expect(res.statusCode).toEqual(200);
                expect(deletedAds).toBe(null);

            });
        });
    });
});

