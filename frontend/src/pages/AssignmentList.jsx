import { useState, useEffect } from 'react';
import { fetchAssignmentsList } from '../services/api';
import AssignmentCard from '../components/AssignmentCard';

const AssignmentList = () => {
    const [tasks, setTasks] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const getTasks = async () => {
            try {
                const res = await fetchAssignmentsList();
                setTasks(res.data);
            } catch (err) {
                console.error('uh oh, load assignments failed:', err);
            } finally {
                setIsLoadingData(false);
            }
        };
        getTasks();
    }, []);

    if (isLoadingData) return <div className="page-title-container"><div className="page-title">Please wait, loading...</div></div>;

    return (
        <div className="page-title-container">
            <h1 className="page-title">Available SQL Challenges</h1>
            <div className="assignment-list">
                {tasks.map(item => (
                    <AssignmentCard key={item._id} details={item} />
                ))}
            </div>
        </div>
    );
};

export default AssignmentList;
