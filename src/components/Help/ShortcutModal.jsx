import React from "react";
import "./HelpModal.css";


function ShortcutModal({ shortcuts, onClose }) {

    return (
        <div className="modal-overlay">

            <div className="modal-box help-modal">

                <h2>⌨ Keyboard Shortcuts</h2>

                <table className="shortcut-table">

                    <thead>

                        <tr>
                            <th>Shortcut</th>
                            <th>Action</th>
                        </tr>

                    </thead>

                    <tbody>

                        {shortcuts.map((s, index) => (

                            <tr key={index}>

                                <td>
                                    Alt + {s.shift ? "Shift + " : ""}
                                    {s.key.toUpperCase()}
                                </td>

                                <td>{s.label}</td>

                            </tr>

                        ))}

                    </tbody>

                </table>

                <div className="modal-actions">

                    <button
                        className="modal-btn ok"
                        onClick={onClose}
                    >
                        Close
                    </button>

                </div>

            </div>

        </div>
    );

}

export default ShortcutModal;