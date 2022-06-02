const isEmail = ((email) => {

const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
if(email.match(regEx)) return true;
else return false;
})
//know whether string is empty or not
const isEmpty = (string => {
if(string.trim()==='') return true;
else return false;
})

exports.validateSignupData = (data) => {
    let errors = {};
    if(isEmpty(data.email)) {
        errors.email = 'Must not be empty.'
    } else if(!isEmail(data.email)) {
        errors.email = 'Must be a valid email address.'
    }

    if(isEmpty(data.password)) errors.password='Must not be empty.';
    if(data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords must match.';

    if(isEmpty(data.handle)) errors.handle='Must not be empty.';

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.validateLoginData = (data) => {
    let errors = {};

    if(isEmpty(data.email)) errors.email='Must not be empty.';
    if(isEmpty(data.password)) errors.password='Must not be empty.';

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.reduceUserDetails = (data) => {
    let userDetails = {};

    if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
    if(!isEmpty(data.website.trim())) {
        //if this is not http then we need to add it to website 
        if(data.website.trim().substring(0,4) !== 'http') {
            userDetails.website = `http://${data.website.trim()}`;
        } else userDetails.website = data.website;
    }
    if(!isEmpty(data.location.trim())) userDetails.location = data.location;
    //makes sure we don't submit an empty string as value for our db, if it is empty we don't add that key
    return userDetails;

}