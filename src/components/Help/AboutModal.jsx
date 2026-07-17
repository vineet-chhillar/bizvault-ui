import React from "react";
import "./HelpModal.css";

function AboutModal({ onClose }) {

    return (
        <div className="modal-overlay">
            <div className="modal-box about-modal">
                <h2>DhanSutra</h2>

<p className="about-subtitle">
    Smart Business Management Solution
</p>

<p className="about-tagline">
    GST Billing • Inventory • Accounting • Business Reports
</p>

<hr />

<table className="about-table">
    <tbody>
        <tr>
            <td><b>Version</b></td>
            <td>1.0.0</td>
        </tr>

        <tr>
            <td><b>Edition</b></td>
            <td>Professional</td>
        </tr>

        <tr>
            <td><b>Developed By</b></td>
            <td>JWD Soft</td>
        </tr>

        <tr>
            <td><b>Website</b></td>
            <td>www.jwdsoft.com</td>
        </tr>

        <tr>
            <td><b>Support</b></td>
            <td>customercare@jwdsoft.in</td>
        </tr>

        <tr>
            <td><b>Copyright</b></td>
            <td>© 2026 JWD Soft. All Rights Reserved.</td>
        </tr>
    </tbody>
</table>
                <br />
             

               **DhanSutra** is a powerful, all-in-one business management solution that brings GST billing, inventory management, accounting, and business reporting together in a single, intuitive platform. Designed for retailers, wholesalers, distributors, and small to medium-sized enterprises, DhanSutra streamlines every stage of business operations—from creating GST-compliant invoices and managing inventory to tracking receivables, payables, expenses, and financial performance. With comprehensive accounting, insightful reports, secure data management, automated backups, and role-based user access, DhanSutra empowers businesses to operate with greater accuracy, efficiency, and confidence. By eliminating manual processes and providing real-time visibility into business operations, DhanSutra enables organizations to improve productivity, maintain regulatory compliance, and focus on sustainable growth.



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

export default AboutModal;