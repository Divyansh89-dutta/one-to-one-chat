const mongoose = require('mongoose');

function connect(uri) {
    mongoose.connect(uri)
        .then(() => {
            console.log('Connected to the database');
        })
        .catch((error) => {
            console.error('Error connecting to the database: ', error);
            process.exit(1);
        });
}

module.exports = connect
