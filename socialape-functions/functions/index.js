const functions = require("firebase-functions");
const { ResultStorage } = require("firebase-functions/v1/testLab");

const app = require('express')();

const FBAuth = require('./util/fbAuth');
const { db } = require('./util/admin');

const { getAllScreams,postOneScream,getScream,commentOnScream,likeScream,unlikeScream,deleteScream } = require('./handlers/screams');
const { signup,login,uploadImage, addUserDetails , getAuthenticatedUser,getUserDetails,markNotificationsRead} = require("./handlers/users");


//const firebase = require('firebase/app');
//firebase.initializeApp(firebaseConfig);
//const { decode } = require("firebase-functions/lib/common/providers/https");
require('./node_modules/firebase/firebase-auth');


//scream routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);
app.get('/scream/:screamId/like',FBAuth,likeScream);
app.get('/scream/:screamId/unlike',FBAuth,unlikeScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream)
//users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image',FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

exports.api = functions.region('southamerica-east1').https.onRequest(app);

exports.createNotificationOnLike = functions.region('southamerica-east1').firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/screams/${snapshot.data().screamId}`).get()
        .then(doc => {
            if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'like',
                    read: false,
                    screamId: doc.id
                });
            }
        })
        .catch(err => {
            console.error(err);
        })
    });

exports.deleteNotificationOnUnlike = functions.region('southamerica-east1').firestore.document('likes/{id}')
    .onDelete(snapshot => {
    return db.doc(`/notifications/${snapshot.id}`)
        .delete()
        .catch((err) => {
            console.error(err);
            return;
        });
    });
exports.createNotificationOnComment = functions.region('southamerica-east1').firestore.document('comments/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/screams/${snapshot.data().screamId}`).get()
        .then((doc) => {
            if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'comment',
                    read: false,
                    screamId: doc.id
                });
            }
        })
        .catch(err => {
            console.error(err);
            return;
        });
    });

exports.onUserImageChange = functions.region('southamerica-east1').firestore.document('/users/{userId}')
    .onUpdate((change) => {
        console.log(change.before.data());
        console.log(change.after.data());
        if(change.before.data().imageUrl !== change.after.data().imageUrl) {
            console.log('image has changed');
            const batch = db.batch();
            return db.collection('screams').where('userHandle', '==', change.before.data().handle).get()
            .then((data) => {
                data.forEach(doc => {
                    const scream = db.doc(`/screams/${doc.id}`);
                    batch.update(scream, {userImage: change.after.data().imageUrl});
                });
                return batch.commit();
            });
        } else {
            return true;
        }
       
    });

//when scream is deleted all likes n comments will be deleted as well
exports.onScreamDelete = functions.region('southamerica-east1').firestore.document('/screams/{screamId}')
.onDelete((snapshot,context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return db.collection('comments').where('screamId', '==', screamId).get()
    .then((data) => {
        data.forEach(doc => {
            batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection('likes').where('screamId', '==', screamId).get();
    })
    .then((data) => {
        data.forEach(doc => {
            batch.delete(db.doc(`/likes/${doc.id}`));
        })
        return db.collection('notifications').where('screamId', '==', screamId).get();
    })
    .then((data) => {
        data.forEach(doc => {
            batch.delete(db.doc(`/notifications/${doc.id}`));
        })
        return batch.commit();
    })
    .catch((err) => console.error(err));
})