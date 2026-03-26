import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [edited, setEdited] = useState({});

  useEffect(() => { api.get('/settings').then(r => setSettings(r.data.data)); }, []);

  const save = async () => {
    const payload = settings.map(s => ({ settingKey: s.SettingKey, settingValue: edited[s.SettingKey] ?? s.SettingValue }));
    try {
      await api.put('/settings', { settings: payload });
      toast.success('Settings saved');
    } catch(e) { toast.error('Error saving'); }
  };

  return (
    <Layout title="System Settings">
      <div className="page-header"><h2>System Settings</h2></div>
      <div className="panel">
        <div className="panel-body">
          <div className="form-grid">
            {settings.map(s => (
              <div className="form-group" key={s.SettingKey}>
                <label className="form-label">{s.SettingKey.replace(/([A-Z])/g,' $1').trim()}</label>
                <input className="form-control" defaultValue={s.SettingValue}
                  onChange={e => setEdited(prev => ({...prev, [s.SettingKey]: e.target.value}))} />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button className="btn btn-primary btn-lg" onClick={save}>Save All Settings</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
