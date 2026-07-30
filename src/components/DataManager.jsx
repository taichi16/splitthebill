import React, { useState } from 'react';
import { RefreshCw, Download, Upload, Trash2, Database, Smartphone, Share, PlusSquare, MapPin, Check } from 'lucide-react';
import { resetToDefaultData, clearAllData } from '../utils/storage';

export default function DataManager({ tripName, setTripName, members, expenses, setMembers, setExpenses, onShowToast }) {
  const [localTripName, setLocalTripName] = useState(tripName || '');

  const handleSaveTripName = (e) => {
    e.preventDefault();
    if (!localTripName.trim()) {
      onShowToast('請輸入行程名稱！');
      return;
    }
    setTripName(localTripName.trim());
    onShowToast(`已更新行程名稱為「${localTripName.trim()}」`);
  };

  const handleLoadSample = () => {
    if (confirm('確定要載入預設範例資料嗎？（這將覆蓋現有資料）')) {
      const { tripName: newT, members: newM, expenses: newE } = resetToDefaultData();
      setTripName(newT);
      setLocalTripName(newT);
      setMembers(newM);
      setExpenses(newE);
      onShowToast('已成功載入「墾丁親子三日遊」範例資料！');
    }
  };

  const handleClearAll = () => {
    if (confirm('🚨 警告：確定要清空所有成員與記帳資料嗎？此動作無法復原！')) {
      const { tripName: newT, members: newM, expenses: newE } = clearAllData();
      setTripName(newT);
      setLocalTripName('');
      setMembers(newM);
      setExpenses(newE);
      onShowToast('已清空所有帳務資料');
    }
  };

  const handleExportJSON = () => {
    const data = {
      version: '1.0',
      appName: '多人記帳拆帳',
      exportDate: new Date().toISOString(),
      tripName,
      members,
      expenses
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `${tripName || '多人記帳拆帳'}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('已匯出 JSON 備份檔案！');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.members && parsed.expenses) {
          if (parsed.tripName) {
            setTripName(parsed.tripName);
            setLocalTripName(parsed.tripName);
          }
          setMembers(parsed.members);
          setExpenses(parsed.expenses);
          onShowToast('已成功匯入 JSON 備份資料！');
        } else {
          alert('匯入失敗：格式不符合需求。');
        }
      } catch (err) {
        alert('匯入失敗：JSON 格式錯誤。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="data-manager">
      {/* Trip Name Settings Card */}
      <div className="card">
        <div className="section-title" style={{ fontSize: '0.95rem', marginBottom: '8px' }}>
          ✈️ 這次的行程/活動名稱設定
        </div>
        <form onSubmit={handleSaveTripName}>
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">行程名稱（例如：墾丁親子三日遊、2026家族旅行）</label>
            <input
              type="text"
              className="form-control"
              placeholder="請輸入行程或活動名稱"
              value={localTripName}
              onChange={e => setLocalTripName(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            <Check size={18} /> 儲存行程名稱
          </button>
        </form>
      </div>

      {/* PWA Mobile Installation Guide Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)', color: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '1rem', marginBottom: '8px' }}>
          <Smartphone size={20} color="#60a5fa" /> 📱 安裝「多人記帳拆帳」至 iPhone 手機桌面
        </div>
        <p style={{ fontSize: '0.82rem', opacity: 0.9, marginBottom: '10px' }}>
          本系統已具備 PWA 技術，安裝後可無網址列全螢幕開啟、像原生 App 一樣順暢並支援完全離線記帳！
        </p>

        <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
          <div style={{ fontWeight: '700', color: '#fbbf24', marginBottom: '4px' }}>🍎 iPhone Safari 安裝步驟：</div>
          <ol style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <li>點擊 Safari 瀏覽器底部的 <strong>分享按鈕 <Share size={12} inline /></strong></li>
            <li>往下滑選擇 <strong>「加入主畫面」<PlusSquare size={12} inline /></strong></li>
            <li>點擊右上角「新增」，手機桌面即出現專屬 App 圖示！</li>
          </ol>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">
          <Database size={20} color="var(--primary)" /> 資料備份與管理
        </h2>
      </div>

      <div className="card">
        <div className="section-title" style={{ fontSize: '0.95rem', marginBottom: '8px' }}>
          ✨ 快速體驗與試用
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          點擊載入包含「夫妻檔、小孩歸屬家長、小孩指定金額扣除後大人平分」的完整預設資料。
        </p>
        <button className="btn btn-outline btn-block" onClick={handleLoadSample}>
          <RefreshCw size={18} /> 載入預設範例資料 (墾丁親子遊)
        </button>
      </div>

      <div className="card">
        <div className="section-title" style={{ fontSize: '0.95rem', marginBottom: '8px' }}>
          📦 檔案備份與匯入
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          所有記帳資料均自動儲存於手機瀏覽器中。您也可以隨時匯出 JSON 檔案進行備份或在其他手機瀏覽器匯入。
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button className="btn btn-outline" onClick={handleExportJSON}>
            <Download size={16} /> 匯出 JSON 備份
          </button>

          <label className="btn btn-outline" style={{ cursor: 'pointer', margin: 0 }}>
            <Upload size={16} /> 匯入 JSON 備份
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="card" style={{ borderColor: 'var(--danger-light)' }}>
        <div className="section-title" style={{ fontSize: '0.95rem', color: 'var(--danger)', marginBottom: '8px' }}>
          ⚠️ 重置與清空
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          開立新的旅遊行程帳本，清空目前所有的成員與消費明細紀錄。
        </p>
        <button className="btn btn-danger btn-block" onClick={handleClearAll}>
          <Trash2 size={18} /> 清空所有資料
        </button>
      </div>
    </div>
  );
}
