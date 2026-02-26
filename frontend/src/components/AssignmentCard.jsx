import { Link } from 'react-router-dom';

const AssignmentCard = ({ details }) => {
    let diffClass = `assignment-list__badge assignment-list__badge--${details.difficulty ? details.difficulty.toLowerCase() : 'easy'}`;

    return (
        <div className="assignment-list__card">
            <span className={diffClass}>{details.difficulty || 'Easy'}</span>
            <h3 className="assignment-list__title">{details.title}</h3>
            <p className="assignment-list__desc">{details.description}</p>
            <Link to={`/assignment/${details._id}`} className="btn btn--primary" style={{ marginTop: 'auto' }}>
                Solve This
            </Link>
        </div>
    );
};

export default AssignmentCard;
