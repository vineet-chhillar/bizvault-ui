import React, { useEffect, useState } from "react";
import "../components/Item/ItemForms.css";

const BackupSettings = () => {

    const [settings, setSettings] = useState({
        BackupFolder: "",
        EnableAutoBackup: true,
        BackupOnStartup: false,
        BackupDaily: true,
        BackupBeforeYearClosing: true,
        BackupBeforeRestore: true,
        MaxBackupCount: 30,
        LastBackupOn: "",
        LastBackupStatus: ""
    });

    const [loading, setLoading] = useState(false);

    const [modal, setModal] = useState({
        show: false,
        message: ""
    });

    useEffect(() => {

        const handler = (event) => {

            const msg =
                typeof event.data === "string"
                    ? JSON.parse(event.data)
                    : event.data;

            if (msg.action === "GetBackupSettingsResult") {

                setLoading(false);

                if (!msg.success) {

                    setModal({
                        show: true,
                        message: msg.message
                    });

                    return;
                }

                setSettings(msg.data);
            }

            if (msg.action === "SaveBackupSettingsResult") {

                setLoading(false);

                setModal({
                    show: true,
                    message: msg.success
                        ? "Backup settings saved successfully."
                        : msg.message
                });
            }

            if (msg.action === "CreateBackupResult") {

                setLoading(false);

                setModal({
                    show: true,
                    message: msg.success
                        ? "Database backup created successfully."
                        : msg.message
                });

                if (msg.success)
                    loadSettings();
            }

        };

        window.chrome?.webview?.addEventListener(
            "message",
            handler);

        loadSettings();

        return () =>
            window.chrome?.webview?.removeEventListener(
                "message",
                handler);

    }, []);

    const loadSettings = () => {

        setLoading(true);

        window.chrome.webview.postMessage({
            Action: "GetBackupSettings"
        });

    };

    const save = () => {

        setLoading(true);

        window.chrome.webview.postMessage({
            Action: "SaveBackupSettings",
            Payload: settings
        });

    };

    const browseFolder = () => {

        window.chrome.webview.postMessage({
            Action: "BrowseBackupFolder"
        });

    };

    const createBackup = () => {

        setLoading(true);

        window.chrome.webview.postMessage({
            Action: "CreateBackupNow"
        });

    };

    return (

<div className="form-container">

<div className="form-inner">

<h2 className="form-title">
Backup Settings
</h2>

<div className="inventory-form">

<div className="form-row">

<div className="form-group">

<label>Backup Folder</label>

<input
type="text"
value={settings.BackupFolder}
onChange={(e)=>
setSettings({
...settings,
BackupFolder:e.target.value
})
}
/>

</div>

<div
style={{
display:"flex",
alignItems:"end"
}}
>

<button
className="btn-submit small"
onClick={browseFolder}
>

Browse

</button>

</div>

</div>

<div className="form-row">

<label>
{/*checked={settings.EnableAutoBackup}*/}
<input
type="checkbox"
 checked={false}
    disabled
onChange={(e)=>
setSettings({
...settings,
EnableAutoBackup:e.target.checked
})
}
/>

&nbsp;

Enable Automatic Backup

</label>

</div>

<div className="form-row">

<label>
{/*checked={settings.BackupOnStartup}*/}
<input
type="checkbox"
checked={false}
    disabled
onChange={(e)=>
setSettings({
...settings,
BackupOnStartup:e.target.checked
})
}
/>

&nbsp;

Backup On Startup

</label>

</div>

<div className="form-row">

<label>

<input
type="checkbox"
checked={settings.BackupDaily}
onChange={(e)=>
setSettings({
...settings,
BackupDaily:e.target.checked
})
}
/>

&nbsp;

Daily Backup

</label>

</div>

<div className="form-row">

<label>

<input
type="checkbox"
checked={settings.BackupBeforeYearClosing}
onChange={(e)=>
setSettings({
...settings,
BackupBeforeYearClosing:e.target.checked
})
}
/>

&nbsp;

Backup Before Financial Year Closing

</label>

</div>

<div className="form-row">

<label>
{/*checked={settings.BackupBeforeRestore}*/}
<input
type="checkbox"
checked={false}
    disabled
onChange={(e)=>
setSettings({
...settings,
BackupBeforeRestore:e.target.checked
})
}
/>

&nbsp;

Backup Before Database Restore

</label>

</div>

<div className="form-row">

<div className="form-group">

<label>

Maximum Backups To Keep

</label>

<input
type="number"
value={settings.MaxBackupCount}
onChange={(e)=>
setSettings({
...settings,
MaxBackupCount:e.target.value
})
}
/>

</div>

</div>

</div>

<div className="table-container">

<h3 className="table-title">

Backup Information

</h3>

<table className="data-table">

<tbody>

<tr>

<td>Default Database</td>

<td>

Documents/DhanSutra/billing.db

</td>

</tr>

<tr>

<td>Default Backup Folder</td>

<td>

Documents/DhanSutra/Backups

</td>

</tr>

<tr>

<td>Last Backup</td>

<td>

{settings.LastBackupOn || "Never"}

</td>

</tr>

<tr>

<td>Status</td>

<td>

{settings.LastBackupStatus || "-"}

</td>

</tr>

</tbody>

</table>

</div>

<div className="inventory-form">

<h3 className="table-title">

Notes

</h3>

<ul
style={{
marginTop:12,
lineHeight:1.8
}}
>

<li>
Backups are created as a copy of the billing database.
</li>

<li>
It is recommended to keep the backup folder inside Google Drive, OneDrive or Dropbox for automatic cloud synchronization.
</li>

<li>
A backup can be created manually at any time.
</li>

<li>
Backups will be created automatically before critical operations if enabled.
</li>

<li>
Old backups beyond the configured limit will be deleted automatically.
</li>

</ul>

</div>

<div className="inventory-btns">

<button
className="btn-submit small"
onClick={save}
disabled={loading}
>

Save Settings

</button>

<button
className="btn-submit small"
onClick={createBackup}
disabled={loading}
>

Create Backup Now

</button>

</div>

</div>

{modal.show && (

<div className="modal-overlay">

<div className="modal-box">

<p>

{modal.message}

</p>

<div className="modal-actions">

<button
className="modal-btn ok"
onClick={()=>
setModal({
show:false,
message:""
})
}
>

OK

</button>

</div>

</div>

</div>

)}

</div>

    );

};

export default BackupSettings;
