const { spawn } = require('child_process');
const path = require('path');

/**
 * Executes the Python OCR service script for a given image file.
 * @param {string} filePath - Absolute path to the image file.
 * @returns {Promise<Object>} - Parsed JSON output from the OCR service.
 */
const executePythonOCR = (filePath) => {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, '..', 'ocr', 'ocr_service.py');
        const pythonProcess = spawn('python3', [pythonScript, filePath]);

        let dataString = '';
        let errorString = '';

        // Collect data from stdout
        pythonProcess.stdout.on('data', (chunk) => {
            dataString += chunk;
        });

        // Collect errors from stderr
        pythonProcess.stderr.on('data', (chunk) => {
            errorString += chunk;
        });

        // Handle process completion
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`OCR Process failed with code ${code}: ${errorString}`));
            }

            try {
                const parsedOutput = JSON.parse(dataString);
                if (parsedOutput.error) {
                    return reject(new Error(parsedOutput.error));
                }
                resolve(parsedOutput);
            } catch (err) {
                reject(new Error(`Failed to parse OCR response: ${err.message}`));
            }
        });

        // Handle process errors (e.g., failed to start)
        pythonProcess.on('error', (err) => {
            reject(new Error(`Failed to start OCR process: ${err.message}`));
        });
    });
};

module.exports = { executePythonOCR };
