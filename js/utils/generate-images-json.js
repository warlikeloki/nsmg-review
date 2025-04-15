const fs = require('fs');
const path = require('path');

const imageDir = path.join(__dirname, '..', 'media', 'photos');
const outputFilePath = path.join(__dirname, '..', 'json', 'images.json'); // Corrected path to json/images.json

fs.readdir(imageDir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    });

    const jsonData = JSON.stringify(imageFiles, null, 2);

    fs.writeFile(outputFilePath, jsonData, err => {
        if (err) {
            console.error('Error writing JSON file:', err);
        } else {
            console.log('images.json created successfully!');
        }
    });
});