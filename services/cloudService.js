const Cloud = require('@google-cloud/storage');
const path = require('path');

const { Storage } = Cloud;

const storage = new Storage({
    // keyFilename: path.join(__dirname, '..', 'cloudkey.json')
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
})
const bucket = storage.bucket('pj02-mern');


const uploadImage = async (file) => {
    try {
        const { originalname, buffer, mimetype } = file;
        const timestamp = Date.now();
        const blob = bucket.file(timestamp + originalname.replace(/ /g, "_"));
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: mimetype,
            },
        });
        return new Promise((resolve, reject) => {
            blobStream.on('error', (err) => {
                reject(err);
            });
            blobStream.on('finish', () => {
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                resolve(publicUrl);
            });
            blobStream.end(buffer);
        });
    } catch (error) {
        throw new Error('Cannot Upload Image');;
    }
};

module.exports = uploadImage;
