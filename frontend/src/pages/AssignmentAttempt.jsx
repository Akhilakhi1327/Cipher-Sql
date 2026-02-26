import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { fetchSingleAssignment, submitStudentSql, requestAiHelp } from '../services/api';

const AssignmentAttempt = () => {
    const { id } = useParams();
    const [taskData, setTaskData] = useState(null);
    const [sqlDraft, setSqlDraft] = useState('');
    const [queryOutput, setQueryOutput] = useState(null);
    const [queryFailMessage, setQueryFailMessage] = useState(null);

    const [aiSuggest, setAiSuggest] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [isDbRunning, setIsDbRunning] = useState(false);

    useEffect(() => {
        const getDetails = async () => {
            try {
                const res = await fetchSingleAssignment(id);
                setTaskData(res.data);
                if (res.data?.sampleTables?.length > 0) {
                    setSqlDraft(`SELECT * FROM ${res.data.sampleTables[0].tableName};`);
                }
            } catch (err) {
                console.error("error grabbing the assignment:", err);
            }
        };
        getDetails();
    }, [id]);

    const runSqlCode = async () => {
        setIsDbRunning(true);
        setQueryFailMessage(null);
        setQueryOutput(null);
        try {
            const body = {
                sqlQuery: sqlDraft,
                assignmentId: id,
                userId: 'local_tester_123'
            };
            const postReq = await submitStudentSql(body);
            setQueryOutput(postReq.data);
        } catch (e) {
            setQueryFailMessage(e.response?.data?.error || e.message);
        } finally {
            setIsDbRunning(false);
        }
    };

    const callAiTutor = async () => {
        setIsAiThinking(true);
        setAiSuggest('');
        try {
            const hintPromptData = {
                question: taskData.question,
                userCode: sqlDraft,
                schemaInfo: taskData.sampleTables
            };
            const res = await requestAiHelp(hintPromptData);
            setAiSuggest(res.data.theHint);
        } catch (e) {
            setAiSuggest('AI is taking a nap. Could not fetch hint.');
        } finally {
            setIsAiThinking(false);
        }
    };

    if (!taskData) return <div className="page-title-container"><div className="page-title">Loading up what you need to do...</div></div>;

    return (
        <div className="attempt-layout">


            <div className="layout-col layout-col--left">



                <div className="card-box">
                    <div className="card-box__header">Assignment Details</div>
                    <div className="card-box__content">
                        <h3>{taskData.title}</h3>
                        <p>{taskData.question}</p>
                    </div>
                </div>



                <div className="card-box card-box--auto" style={{ flexGrow: 1 }}>
                    <div className="card-box__header">Database Context</div>
                    <div className="card-box__content">
                        {taskData.sampleTables && taskData.sampleTables.map((tbl, index) => (
                            <div key={index}>
                                <div className="schema-box">
                                    <div className="schema-box__title">{tbl.tableName}</div>
                                    <div className="schema-box__divider">---------</div>
                                    {tbl.columns.map(c => (
                                        <div key={c.columnName} className="schema-box__col">
                                            <span className="col-name">{c.columnName}</span>
                                            <span className="col-type">{c.dataType}</span>
                                        </div>
                                    ))}
                                </div>

                                {tbl.rows && tbl.rows.length > 0 && (
                                    <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                                        <table className="results-table">
                                            <thead>
                                                <tr>
                                                    {Object.keys(tbl.rows[0]).map(k => (
                                                        <th key={k}>{k}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tbl.rows.slice(0, 3).map((rowItem, rIdx) => (
                                                    <tr key={rIdx}>
                                                        {Object.values(rowItem).map((val, vIdx) => (
                                                            <td key={vIdx}>{String(val)}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                                            Showing sample rows...
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>



            <div className="layout-col layout-col--right">



                <div className="card-box card-box--editor">
                    <div className="card-box__header">
                        <span>Query Editor</span>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn btn--secondary" onClick={callAiTutor} disabled={isAiThinking}>
                                {isAiThinking ? 'Asking AI...' : 'Get Hint'}
                            </button>
                            <button className="btn btn--success" onClick={runSqlCode} disabled={isDbRunning || !sqlDraft.trim()}>
                                {isDbRunning ? 'Running...' : 'Run Query'}
                            </button>
                        </div>
                    </div>


                    <Editor
                        height="100%"
                        defaultLanguage="sql"
                        theme="vs-dark"
                        value={sqlDraft}
                        onChange={(val) => setSqlDraft(val || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 15,
                            fontFamily: "'Fira Code', monospace",
                            padding: { top: 16 },
                            scrollBeyondLastLine: false,
                            wordWrap: 'on'
                        }}
                    />
                </div>



                <div className="card-box card-box--results">
                    <div className="card-box__header">Query Result Box</div>
                    <div className="card-box__content" style={{ padding: '0 1.25rem 1.25rem' }}>



                        {aiSuggest && (
                            <div className="hint-box" style={{ marginTop: '1.25rem' }}>
                                <div className="hint-box__title">AI Assistant Hint</div>
                                <div>{aiSuggest}</div>
                            </div>
                        )}

                        {queryFailMessage && (
                            <div className="console-msg--error" style={{ marginTop: '1.25rem' }}>
                                <strong>Execution Error:</strong><br /><br />{queryFailMessage}
                            </div>
                        )}

                        {queryOutput && queryOutput.cols && (
                            <div style={{ marginTop: '1.25rem' }}>
                                <div className="console-msg--success">
                                    Query ran successfully. Returned {queryOutput.recordsCount} rows.
                                </div>
                                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <table className="results-table" style={{ marginTop: 0, border: 'none' }}>
                                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                            <tr>
                                                {queryOutput.cols.map((colName, cIdx) => (
                                                    <th key={cIdx} style={{ backgroundColor: '#111827' }}>{colName}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {queryOutput.rows.map((rowObj, rowInd) => (
                                                <tr key={rowInd}>
                                                    {queryOutput.cols.map((colToGrab, jIdx) => (
                                                        <td key={jIdx}>{String(rowObj[colToGrab])}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                            {queryOutput.rows.length === 0 && (
                                                <tr>
                                                    <td colSpan={queryOutput.cols.length} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                                        No data returned by query.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {!queryOutput && !queryFailMessage && !aiSuggest && (
                            <div className="console-msg--empty">
                                <span style={{ fontSize: '2rem', opacity: 0.5 }}>◲</span>
                                Run a query or request a hint to see the output here.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentAttempt;
