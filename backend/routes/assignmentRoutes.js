const express = require('express');
const routingPaths = express.Router();
const {
    getAllAssignmentsList,
    getSingleAssignmentInfo,
    runStudentQuery,
    generateHintFromAI
} = require('../controllers/assignmentController');


routingPaths.get('/', getAllAssignmentsList);
routingPaths.get('/:id', getSingleAssignmentInfo);
routingPaths.post('/run-sql', runStudentQuery);
routingPaths.post('/ai-hint', generateHintFromAI);

module.exports = routingPaths;
