const Cloud = require('@google-cloud/storage');
const path = require('path');

const {Storage} = Cloud;
const storage = new Storage({
    keyFilename: path.join(__dirname, '..', 'cloudkey.json')
})
const bucket = storage.bucket('mearn-app-01');


const uploadImage = async (file) => {
    try {
        const { originalname, buffer, mimetype } = file;
        const timestamp = Date.now(); // Ensure a timestamp is available
        const blob = bucket.file(timestamp+originalname.replace(/ /g, "_") ); // Replace spaces with underscores in the filename
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: mimetype,
            },
        });
        return new Promise((resolve, reject) => {
            blobStream.on('error', (err) => {
                reject(err); // Reject the promise if there is an error
            });
            blobStream.on('finish', () => {
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                resolve(publicUrl); // Resolve the promise with the URL once upload finishes
            });
            blobStream.end(buffer);
        });
    } catch (error) {
        throw error; // Propagate the error to be handled outside
    }
};

module.exports = uploadImage;
