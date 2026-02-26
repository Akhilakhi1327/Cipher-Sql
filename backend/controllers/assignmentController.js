const Assignment = require('../models/Assignment');
const UserProgress = require('../models/UserProgress');
const pool = require('../config/postgres');
const { fetchHintFromLLM } = require('../utils/llm');



const namesList = [
    "Akhil", "Teja", "Hunnu", "Thiru N.", "William Jhonson",
    "Charishma Punnapureddy", "Varri Vishwa Karnudu", "Mamidi Laxmi Venkata Sambasivarao",
    "Pativada Pradeep", "Koduru Vasu", "Bandaru Deepika", "Addaguduru Chitti Siri Varshini",
    "Pothina Ramakrishna", "Gusidi Yamini", "Boni Sumanth Kumar", "Kala Prasanth",
    "Bheemarasetty Navya Sri", "Buddala Komal Vamsi", "Bendi Gayatri", "Ananthapatnaikuni Charan Sai",
    "Pentakota Laxmi Narayana", "L. Jhansi", "Avagadda Hemalatha", "Korada Rithwika",
    "Animireddy Deepika", "Pathivada Mahesh", "Bhogapurapu Vennela", "Bandaru Lavaraju",
    "Kamavarapu Kaivalya", "Anupoju Meghana", "Marasu Revanth", "Lakkoju Sai Divya",
    "Kotyada Lakshmi", "Modalavalasa Vasanta Sai Bhargavi", "Meesala Rakesh", "Paturu Ramya Sri",
    "Samireddy Yasaswini", "Anumanthu Rohith Kumar", "Korada Satish", "Ramoji Kasi Rama Durga Dhanesh",
    "Padala Kirankumar", "J Hemasundar", "Gavidi Anitha"
];

const generateMockAssignments = () => {
    let tasks = [];
    for (let i = 1; i <= 20; i++) {
        let diffLevel = 'Easy';
        let problemTitle = `SQL Challenge #${i}: Filter Users Data`;
        let problemQuestion = `Write a SQL query to select all fields from the \`users_batch_${i}\` table where \`department\` is "Engineering".`;

        if (i % 3 === 0) {
            diffLevel = 'Hard';
            problemTitle = `SQL Challenge #${i}: Find Average Departments`;
            problemQuestion = `Write a SQL query to select the average \`salary\` from the \`users_batch_${i}\` table where \`department\` matches "Engineering".`;
        } else if (i % 2 === 0) {
            diffLevel = 'Medium';
            problemTitle = `SQL Challenge #${i}: Identify Top Salary`;
            problemQuestion = `Write a SQL query to select the maximum \`salary\` from the \`users_batch_${i}\` table among all employees.`;
        }



        const startIdx = (i * 2) % (namesList.length - 5);
        const chunk = namesList.slice(startIdx, startIdx + 5);

        tasks.push({
            _id: String(i),
            title: problemTitle,
            description: diffLevel,
            question: problemQuestion,
            sampleTables: [
                {
                    tableName: `users_batch_${i}`,
                    columns: [
                        { columnName: 'id', dataType: 'INTEGER' },
                        { columnName: 'full_name', dataType: 'TEXT' },
                        { columnName: 'department', dataType: 'TEXT' },
                        { columnName: 'salary', dataType: 'INTEGER' }
                    ],
                    rows: chunk.map((n, idx) => ({
                        id: (i * 100) + idx,
                        full_name: n,
                        department: idx % 2 === 0 ? 'Engineering' : 'HR',
                        salary: 50000 + (idx * 2500)
                    }))
                }
            ],
            expectedOutput: {
                outputType: 'table',
                value: chunk.filter((n, idx) => idx % 2 === 0).map((n, idx) => ({
                    id: (i * 100) + (idx * 2),
                    full_name: n,
                    department: 'Engineering',
                    salary: 50000 + ((idx * 2) * 2500)
                }))
            }
        });
    }
    return tasks;
};
const dummyRecords = generateMockAssignments();

exports.getAllAssignmentsList = async (req, res) => {
    try {
        let items = [];
        if (require('mongoose').connection.readyState === 1) {
            items = await Assignment.find().select('-sampleTables -expectedOutput');
        }

        if (items.length === 0) {
            items = dummyRecords.map(({ sampleTables, expectedOutput, ...others }) => others);
        }

        res.json(items);
    } catch (err) {
        console.error('get assignments fail:', err);
        res.status(500).json({ error: 'Server exploded while fetching' });
    }
};

exports.getSingleAssignmentInfo = async (req, res) => {
    try {
        let singleItem = null;
        if (require('mongoose').connection.readyState === 1) {
            try {
                singleItem = await Assignment.findById(req.params.id);
            } catch (dbErr) {


                console.log('Could not find by mongo ID, falling back...');
            }
        }

        if (!singleItem) {
            singleItem = dummyRecords.find(x => x._id === req.params.id);
        }

        if (!singleItem) {
            return res.status(404).json({ error: 'Not found mate' });
        }

        res.json(singleItem);
    } catch (err) {
        console.error('get single err:', err);
        res.status(500).json({ error: 'oopsie getting assignment' });
    }
};

exports.runStudentQuery = async (req, res) => {
    const passedQuery = req.body.sqlQuery;
    const assignmentId = req.body.assignmentId;
    const userId = req.body.userId || 'guest_user';

    if (!passedQuery || typeof passedQuery !== 'string') {
        return res.status(400).json({ error: 'empty query passed' });
    }

    const checkSafe = passedQuery.toUpperCase();
    if (checkSafe.includes('DROP') || checkSafe.includes('DELETE') || checkSafe.includes('UPDATE') || checkSafe.includes('INSERT')) {
        return res.status(403).json({ error: 'Only SELECTs allowed here' });
    }

    try {
        const psqlClient = await pool.connect();
        try {
            await psqlClient.query('BEGIN');
            const executionData = await psqlClient.query(passedQuery);
            await psqlClient.query('ROLLBACK');



            if (require('mongoose').connection.readyState === 1 && assignmentId) {
                UserProgress.findOne({ userId, assignmentId }).then(prog => {
                    if (prog) {
                        prog.sqlQuery = passedQuery;
                        prog.lastAttempt = new Date();
                        prog.attemptCount = prog.attemptCount + 1;
                        prog.save();
                    } else {
                        UserProgress.create({
                            userId: userId,
                            assignmentId: assignmentId,
                            sqlQuery: passedQuery,
                            lastAttempt: new Date(),
                            isCompleted: false,
                            attemptCount: 1
                        });
                    }
                }).catch(e => console.log('progress save error', e));
            }

            res.json({ rows: executionData.rows, cols: executionData.fields.map(field => field.name), recordsCount: executionData.rowCount });
        } catch (dbErr) {
            await psqlClient.query('ROLLBACK');
            res.status(400).json({ error: dbErr.message });
        } finally {
            psqlClient.release();
        }
    } catch (err) {
        console.error('pg db oops:', err.message);
        return res.status(503).json({
            error: 'Database mock fallback hit',
            helpfulMsg: 'Cant connect to postgres. Please make sure postgres is running locally.'
        });
    }
};

exports.generateHintFromAI = async (req, res) => {
    const qDetails = req.body.question;
    const sQuery = req.body.userCode;
    const sSchema = req.body.schemaInfo;

    if (!qDetails) {
        return res.status(400).json({ error: 'need question for context bro' });
    }

    try {
        let stringifiedSchema = typeof sSchema === 'string' ? sSchema : JSON.stringify(sSchema);
        const aiResponse = await fetchHintFromLLM(qDetails, sQuery, stringifiedSchema);
        res.json({ theHint: aiResponse });
    } catch (err) {
        console.error('ai error:', err.message || err);
        if (err.status === 429 || (err.message && err.message.includes('quota'))) {
            return res.json({ theHint: "[AI Quota Exceeded] - Please examine the required table schema and ensure you're filtering by the correct column. Try checking for any typos!" });
        }
        res.status(500).json({ error: 'ai broke down' });
    }
};
