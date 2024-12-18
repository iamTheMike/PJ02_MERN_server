const multer = require ('multer')


const fileFilter = (file) => {
    if(!file){
        return true;
    }
    const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if(allowedFileTypes.includes(file.mimetype)) {
       return true
    } else {
        return false
    }
}
const handleMulterError = (err, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size exceeds the limit of 4MB!' });
        }
        res.status(400).json({ message: err.message });
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next(); 
};

const upload = multer({
    storage: multer.memoryStorage(), //store file in memory as Buffer object
    limits:{
        fileSize: 4 * 1024 * 1024 //limit 4 mb
    },
})


module.exports = {upload,fileFilter,handleMulterError};
