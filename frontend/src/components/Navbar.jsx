import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="navbar" style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            <Link to="/" className="navbar__brand" style={{ letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-light)', fontWeight: '800' }}>Cipher</span>
                <span style={{ color: 'var(--primary)' }}>SQLStudio</span>
            </Link>
            <div className="navbar__links">
                <Link to="/" className="btn btn--secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>View Challenges</Link>
            </div>
        </nav>
    );
};

export default Navbar;
